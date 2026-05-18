import grpc
from concurrent import futures
import logging

import anonymization_service_pb2
import anonymization_service_pb2_grpc

from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = 50052

_nlp_config = {
    "nlp_engine_name": "spacy",
    "models": [
        {"lang_code": "fr", "model_name": "fr_core_news_md"},
        {"lang_code": "en", "model_name": "en_core_web_md"},
    ],
}
_nlp_engine = NlpEngineProvider(nlp_configuration=_nlp_config).create_engine()
_analyzer = AnalyzerEngine(nlp_engine=_nlp_engine, supported_languages=["fr", "en"])
_anonymizer = AnonymizerEngine()


class AnonymizationServicer(anonymization_service_pb2_grpc.AnonymizationServiceServicer):
    def Anonymize(self, request, context):
        text = request.text
        language = request.language if request.language in ("fr", "en") else "fr"

        results = _analyzer.analyze(text=text, language=language)

        operators = {
            r.entity_type: OperatorConfig("replace", {"new_value": f"[{r.entity_type}]"})
            for r in results
        }
        anonymized = _anonymizer.anonymize(
            text=text,
            analyzer_results=results,
            operators=operators,
        )

        entities = [
            anonymization_service_pb2.DetectedEntity(
                label=r.entity_type,
                original_value=text[r.start : r.end],
                placeholder=f"[{r.entity_type}]",
                start=r.start,
                end=r.end,
            )
            for r in results
        ]

        logger.info(f"Anonymized {len(entities)} entities (lang={language})")
        return anonymization_service_pb2.AnonymizeResponse(
            anonymized_text=anonymized.text,
            entities=entities,
        )


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    anonymization_service_pb2_grpc.add_AnonymizationServiceServicer_to_server(
        AnonymizationServicer(), server
    )
    server.add_insecure_port(f"[::]:{PORT}")
    logger.info(f"anonymization_service starting on port {PORT}...")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
