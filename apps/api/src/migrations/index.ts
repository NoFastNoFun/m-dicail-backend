import { Init1750000000000 } from './init-core-schema';
import { Appointments1750000001000 } from './create-appointments';
import { AddMedicalWatch1750100000000 } from './add-medical-watch';
import { AddRefreshTokenToUser1751000000000 } from './add-refresh-token-to-user';
import { AddRoleToUsers1782811334916 } from './add-role-to-users';
import { AddExercises1783000000000 } from './add-exercises';
import { AddTemplateToRecordingSessions1784000000000 } from './add-template-to-recording-sessions';
import { AddAuthMfaPasskeys1785000000000 } from './add-auth-mfa-passkeys';
import { AddPatientFkAppointmentsSessions1786000000000 } from './add-patient-fk-appointments-sessions';
import { AddPathologiesToRecordingSessions1787000000000 } from './add-pathologies-to-recording-sessions';
import { AddTranscriptIsAiToRecordingSessions1788000000000 } from './add-transcript-is-ai-to-recording-sessions';

export const migrations = [
  Init1750000000000,
  Appointments1750000001000,
  AddMedicalWatch1750100000000,
  AddRefreshTokenToUser1751000000000,
  AddRoleToUsers1782811334916,
  AddExercises1783000000000,
  AddTemplateToRecordingSessions1784000000000,
  AddAuthMfaPasskeys1785000000000,
  AddPatientFkAppointmentsSessions1786000000000,
  AddPathologiesToRecordingSessions1787000000000,
  AddTranscriptIsAiToRecordingSessions1788000000000,
];
