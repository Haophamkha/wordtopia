import { BadRequestException, HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

const TTL_MIN = 10;
const COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private gmailCreds() {
    const clientId = this.config.get<string>('GMAIL_CLIENT_ID');
    const clientSecret = this.config.get<string>('GMAIL_CLIENT_SECRET');
    const refreshToken = this.config.get<string>('GMAIL_REFRESH_TOKEN');
    if (!clientId || !clientSecret || !refreshToken) return null;
    return { clientId, clientSecret, refreshToken };
  }

  // Render free chặn cổng SMTP, nên gửi qua Gmail API (HTTPS).
  private async accessToken(c: { clientId: string; clientSecret: string; refreshToken: string }) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: c.clientId,
        client_secret: c.clientSecret,
        refresh_token: c.refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private async sendMail(
    c: { clientId: string; clientSecret: string; refreshToken: string },
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    const builder = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
    const info = await builder.sendMail({
      from: this.config.get<string>('MAIL_FROM') ?? 'Wordtopia',
      to,
      subject,
      text,
      html,
    });
    const raw = (info.message as unknown as Buffer).toString('base64url');
    const token = await this.accessToken(c);
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Gmail ${res.status}: ${await res.text()}`);
  }

  async request(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Luôn trả ok để không lộ email nào đã đăng ký
    if (!user) return { ok: true };

    const last = await this.prisma.passwordReset.findFirst({ where: { email }, orderBy: { id: 'desc' } });
    if (last && Date.now() - last.createdAt.getTime() < COOLDOWN_MS) {
      throw new HttpException('Vui lòng đợi khoảng 1 phút trước khi gửi lại mã', 429);
    }

    const code = String(randomInt(100000, 1000000));
    await this.prisma.passwordReset.deleteMany({ where: { email } });
    await this.prisma.passwordReset.create({
      data: {
        email,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + TTL_MIN * 60_000),
      },
    });

    const creds = this.gmailCreds();
    if (!creds) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Chưa cấu hình gửi email');
      }
      this.logger.warn(`[DEV] Chưa cấu hình GMAIL_*. Mã OTP cho ${email}: ${code}`);
      return { ok: true };
    }

    try {
      await this.sendMail(
        creds,
        email,
        'Mã xác nhận đặt lại mật khẩu Wordtopia',
        `Mã xác nhận của bạn là ${code}. Mã có hiệu lực trong ${TTL_MIN} phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
        `
          <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border-radius:16px;background:#F6F5FB">
            <h2 style="color:#5240D6;margin:0 0 8px">Wordtopia</h2>
            <p style="color:#1F1D3A">Mã xác nhận đặt lại mật khẩu của bạn:</p>
            <p style="font-size:34px;font-weight:800;letter-spacing:8px;color:#5240D6;margin:12px 0">${code}</p>
            <p style="color:#8683A3;font-size:13px">Mã có hiệu lực trong ${TTL_MIN} phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
          </div>`,
      );
    } catch (e) {
      this.logger.error(`Gửi mail lỗi: ${e instanceof Error ? e.message : String(e)}`);
      await this.prisma.passwordReset.deleteMany({ where: { email } });
      throw new ServiceUnavailableException('Không gửi được email, thử lại sau');
    }
    return { ok: true };
  }

  async reset(rawEmail: string, code: string, newPassword: string) {
    const email = rawEmail.trim().toLowerCase();
    const bad = () => new BadRequestException('Mã không đúng hoặc đã hết hạn');

    const row = await this.prisma.passwordReset.findFirst({ where: { email }, orderBy: { id: 'desc' } });
    if (!row || row.expiresAt.getTime() < Date.now()) throw bad();
    if (row.attempts >= MAX_ATTEMPTS) {
      await this.prisma.passwordReset.deleteMany({ where: { email } });
      throw new BadRequestException('Nhập sai quá nhiều lần, hãy yêu cầu mã mới');
    }
    if (!(await bcrypt.compare(code, row.codeHash))) {
      await this.prisma.passwordReset.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
      throw bad();
    }

    await this.prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });
    await this.prisma.passwordReset.deleteMany({ where: { email } });
    return { ok: true };
  }
}