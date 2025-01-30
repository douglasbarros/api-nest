import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { AuthRegisterDTO } from './dto/auth-register.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { EncryptUtils } from 'src/utils/encrypt.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly mailer: MailerService,
  ) {}

  createToken(user: User) {
    return this.jwtService.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      {
        expiresIn: '7 days',
        subject: String(user.id),
        issuer: 'login',
        audience: 'users',
      },
    );
  }

  checkToken(token: string) {
    try {
      const data = this.jwtService.verify(token, {
        audience: 'users',
        issuer: 'login',
      });
      return data;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email and/or password.');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email and/or password.');
    }

    return {
      data: {
        name: user.name,
        email: user.email,
        access_token: this.createToken(user),
      },
    };
  }

  isValidToken(token: string) {
    try {
      this.checkToken(token);
      return true;
    } catch (e) {
      return false;
    }
  }

  async forget(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email is wrong.');
    }

    const token = this.jwtService.sign(
      {
        id: user.id,
      },
      {
        expiresIn: '30 minutes',
        subject: String(user.id),
        issuer: 'forget',
        audience: 'users',
      },
    );

    await this.mailer.sendMail({
      subject: 'Recuperação de senha',
      to: 'dbs.douglas@gmail.com',
      template: 'forget',
      context: { name: user.name, token },
    });

    return true;
  }

  async reset(password: string, token: string) {
    try {
      const data = this.jwtService.verify(token, {
        audience: 'users',
        issuer: 'forget',
      });

      if (isNaN(Number(data.id))) {
        throw new BadRequestException('Invalid token.');
      }

      password = await EncryptUtils.encryptPass(password);

      const user = await this.prisma.user.update({
        where: {
          id: Number(data.id),
        },
        data: {
          password,
        },
      });

      return this.createToken(user);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async register(data: AuthRegisterDTO) {
    const dbUser = await this.prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });
    if (dbUser) {
      if (!(await bcrypt.compare(data.password, dbUser.password))) {
        throw new UnauthorizedException('Invalid email and/or password.');
      }
      return this.getUserData(dbUser);
    }
    const user = await this.userService.create(data);
    return this.getUserData(user);
  }

  getUserData(user: User) {
    return {
      data: {
        name: user.name,
        email: user.email,
        access_token: this.createToken(user),
      },
    };
  }
}
