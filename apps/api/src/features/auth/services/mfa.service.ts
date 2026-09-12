import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UsersService } from '@features/users/services/users.service';
import { MfaRecoveryCodeRepository } from '../repositories/mfa-recovery-code.repository';
import { MailService } from '../../mail/services/mail.service';
import { buildMfaEnabledEmail } from '../../mail/templates/mfa-enabled.template';
import { decryptSecret, encryptSecret } from '../utils/secret-crypto.util';

const RECOVERY_CODE_COUNT = 8;

@Injectable()
export class MfaService {
  constructor(
    private readonly usersService: UsersService,
    private readonly recoveryCodeRepository: MfaRecoveryCodeRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async enroll(userId: string): Promise<{ otpauthUrl: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (user.mfaEnabled) throw new BadRequestException('MFA deja active');

    const secret = authenticator.generateSecret();
    const encrypted = encryptSecret(secret, this.configService.getOrThrow<string>('SECRET_KEY'));
    // Store the secret encrypted but leave MFA off until the user proves they can generate a code.
    await this.usersService.updateMfa(userId, { totpSecret: encrypted, mfaEnabled: false });

    const otpauthUrl = authenticator.keyuri(user.email, 'Medicail', secret);
    return { otpauthUrl };
  }

  async confirm(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user?.totpSecret) throw new BadRequestException('Enrollment MFA non demarre');
    if (user.mfaEnabled) throw new BadRequestException('MFA deja active');

    const secret = decryptSecret(user.totpSecret, this.configService.getOrThrow<string>('SECRET_KEY'));
    if (!authenticator.verify({ token: code, secret })) {
      throw new UnauthorizedException('Code TOTP invalide');
    }

    await this.usersService.updateMfa(userId, { mfaEnabled: true });
    // Plaintext codes are returned once; only argon2 hashes are stored.
    const recoveryCodes = await this.generateRecoveryCodes(userId);

    const email = buildMfaEnabledEmail({});
    await this.mailService.sendMail(user.email, email.subject, email.html);

    return { recoveryCodes };
  }

  async disable(userId: string, code: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user?.mfaEnabled) throw new BadRequestException('MFA non active');

    const verified = await this.verifyCodeForUser(user, code);
    if (!verified) throw new UnauthorizedException('Code invalide');

    await this.recoveryCodeRepository.deleteAllForUser(userId);
    await this.usersService.updateMfa(userId, { mfaEnabled: false, totpSecret: null });
  }

  async verifyTotpOrRecovery(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user?.mfaEnabled) return false;
    return this.verifyCodeForUser(user, code);
  }

  async verifyTotp(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user?.mfaEnabled || !user.totpSecret) return false;

    const secret = decryptSecret(user.totpSecret, this.configService.getOrThrow<string>('SECRET_KEY'));
    return authenticator.verify({ token: code, secret });
  }

  async disableMfaForRecovery(userId: string): Promise<void> {
    // Password-proven account recovery: drop TOTP + leftover codes so the user can re-enroll.
    await this.recoveryCodeRepository.deleteAllForUser(userId);
    await this.usersService.updateMfa(userId, { mfaEnabled: false, totpSecret: null });
  }

  private async verifyCodeForUser(user: { id: string; totpSecret: string | null }, code: string): Promise<boolean> {
    if (user.totpSecret) {
      const secret = decryptSecret(user.totpSecret, this.configService.getOrThrow<string>('SECRET_KEY'));
      if (authenticator.verify({ token: code, secret })) return true;
    }

    const codes = await this.recoveryCodeRepository.findUnusedByUser(user.id);
    for (const stored of codes) {
      if (stored.usedAt) continue;
      const match = await argon2.verify(stored.hashedCode, code.trim());
      if (match) {
        // Conditional UPDATE so two concurrent logins cannot burn the same recovery code twice.
        const consumed = await this.recoveryCodeRepository.markUsedIfUnused(stored.id);
        if (consumed) return true;
      }
    }

    return false;
  }

  private async generateRecoveryCodes(userId: string): Promise<string[]> {
    await this.recoveryCodeRepository.deleteAllForUser(userId);

    const plaintextCodes: string[] = [];
    const entities = [];

    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const code = randomBytes(5).toString('hex').toUpperCase();
      plaintextCodes.push(code);
      entities.push({
        userId,
        hashedCode: await argon2.hash(code),
        usedAt: null,
      });
    }

    await this.recoveryCodeRepository.saveMany(entities);
    return plaintextCodes;
  }
}
