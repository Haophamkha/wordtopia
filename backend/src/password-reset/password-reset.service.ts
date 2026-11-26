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
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private mailer(): nodemailer.Transporter | null {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!user || !pass) return null;
    if (!this.transporter) {
      const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
    return this.transporter;
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

    const mailer = this.mailer();
    if (!mailer) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Chưa cấu hình gửi email');
      }
      this.logger.warn(`[DEV] Chưa cấu hình SMTP. Mã OTP cho ${email}: ${code}`);
      return { ok: true };
    }

    try {
      await mailer.sendMail({
        from: this.config.get<string>('MAIL_FROM') ?? `Wordtopia <${this.config.get<string>('SMTP_USER')}>`,
        to: email,
        subject: 'Mã xác nhận đặt lại mật khẩu Wordtopia',
        text: `Mã xác nhận của bạn là ${code}. Mã có hiệu lực trong ${TTL_MIN} phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border-radius:16px;background:#F6F5FB">
            <h2 style="color:#5240D6;margin:0 0 8px">Wordtopia</h2>
            <p style="color:#1F1D3A">Mã xác nhận đặt lại mật khẩu của bạn:</p>
            <p style="font-size:34px;font-weight:800;letter-spacing:8px;color:#5240D6;margin:12px 0">${code}</p>
            <p style="color:#8683A3;font-size:13px">Mã có hiệu lực trong ${TTL_MIN} phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
          </div>`,
      });
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