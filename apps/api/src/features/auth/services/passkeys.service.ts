import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { UsersService } from '@features/users/services/users.service';
import { WebAuthnCredentialRepository } from '../repositories/webauthn-credential.repository';
import { WebAuthnChallengeRepository } from '../repositories/webauthn-challenge.repository';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class PasskeysService {
  constructor(
    private readonly usersService: UsersService,
    private readonly credentialRepository: WebAuthnCredentialRepository,
    private readonly challengeRepository: WebAuthnChallengeRepository,
    private readonly configService: ConfigService,
  ) {}

  async getRegistrationOptions(userId: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const existing = await this.credentialRepository.findByUserId(userId);
    const options = await generateRegistrationOptions({
      rpName: this.getRpName(),
      rpID: this.getRpId(),
      userName: user.email,
      userDisplayName: user.fullName ?? user.email,
      userID: Buffer.from(user.id),
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: ['internal', 'hybrid'] as AuthenticatorTransportFuture[],
      })),
    });

    await this.storeChallenge(userId, options.challenge, 'registration');
    return options;
  }

  async verifyRegistration(userId: string, response: RegistrationResponseJSON, deviceName?: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const challengeRecord = await this.challengeRepository.findLatestByUser(userId, 'registration');
    if (!challengeRecord || challengeRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Challenge expire ou introuvable');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: this.getOrigin(),
      expectedRPID: this.getRpId(),
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Enregistrement passkey invalide');
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    await this.credentialRepository.save({
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceName: deviceName ?? `${credentialDeviceType}${credentialBackedUp ? ' (synced)' : ''}`,
    });
  }

  async getAuthenticationOptions(email?: string, mfaUserId?: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    let userId = mfaUserId ?? null;

    if (!userId && email) {
      const user = await this.usersService.findByEmail(email);
      if (!user) throw new NotFoundException('Utilisateur introuvable');
      userId = user.id;
    }

    if (!userId) throw new BadRequestException('Email ou session MFA requis');

    const credentials = await this.credentialRepository.findByUserId(userId);
    if (credentials.length === 0) throw new BadRequestException('Aucune passkey enregistree');

    const options = await generateAuthenticationOptions({
      rpID: this.getRpId(),
      allowCredentials: credentials.map((c) => ({
        id: c.credentialId,
        transports: ['internal', 'hybrid'] as AuthenticatorTransportFuture[],
      })),
    });

    await this.storeChallenge(userId, options.challenge, 'authentication');
    return options;
  }

  async verifyAuthentication(
    response: AuthenticationResponseJSON,
    email?: string,
    mfaUserId?: string,
  ): Promise<string> {
    let userId = mfaUserId ?? null;

    if (!userId && email) {
      const user = await this.usersService.findByEmail(email);
      if (!user) throw new UnauthorizedException('Authentification passkey echouee');
      userId = user.id;
    }

    if (!userId) throw new BadRequestException('Email ou session MFA requis');

    const storedCredential = await this.credentialRepository.findByCredentialId(response.id);
    if (!storedCredential || storedCredential.userId !== userId) {
      throw new UnauthorizedException('Authentification passkey echouee');
    }

    const challengeRecord = await this.challengeRepository.findLatestByUser(userId, 'authentication');
    if (!challengeRecord || challengeRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Challenge expire ou introuvable');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: this.getOrigin(),
      expectedRPID: this.getRpId(),
      credential: {
        id: storedCredential.credentialId,
        publicKey: new Uint8Array(storedCredential.publicKey),
        counter: Number(storedCredential.counter),
      },
    });

    if (!verification.verified) throw new UnauthorizedException('Authentification passkey echouee');

    await this.credentialRepository.save({
      ...storedCredential,
      counter: verification.authenticationInfo.newCounter,
    });

    return userId;
  }

  async listCredentials(userId: string) {
    const credentials = await this.credentialRepository.findByUserId(userId);
    return credentials.map((c) => ({
      id: c.id,
      deviceName: c.deviceName,
      createdAt: c.createdAt,
    }));
  }

  async deleteCredential(userId: string, credentialId: string): Promise<void> {
    const deleted = await this.credentialRepository.deleteByIdForUser(userId, credentialId);
    if (!deleted) throw new NotFoundException('Passkey introuvable');
  }

  async hasPasskeys(userId: string): Promise<boolean> {
    const count = await this.credentialRepository.countByUserId(userId);
    return count > 0;
  }

  private async storeChallenge(userId: string, challenge: string, type: 'registration' | 'authentication'): Promise<void> {
    await this.challengeRepository.deleteExpired();
    await this.challengeRepository.save({
      userId,
      challenge,
      type,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    });
  }

  private getRpId(): string {
    return this.configService.get<string>('WEBAUTHN_RP_ID') ?? 'localhost';
  }

  private getRpName(): string {
    return this.configService.get<string>('WEBAUTHN_RP_NAME') ?? 'Medicail';
  }

  private getOrigin(): string {
    return this.configService.get<string>('WEBAUTHN_ORIGIN') ?? 'http://localhost:3000';
  }
}
