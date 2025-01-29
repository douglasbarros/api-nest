import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthLoginDTO } from './dto/auth-login.dto';
import { AuthRegisterDTO } from './dto/auth-register.dto';
import { AuthForgetDTO } from './dto/auth-forget.dto';
import { AuthResetDTO } from './dto/auth-reset.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { join } from 'path';
import { FileService } from 'src/file/file.service';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { CreateUserDTO } from 'src/user/dto/create-user.dto';
import { EncryptedPayload } from 'src/decorators/encrypted-payload.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly fileService: FileService,
    private readonly encryptService: EncryptService,
  ) {}

  @Post('login')
  async login(@Body() { email, password }: AuthLoginDTO) {
    return this.authService.login(email, password);
  }

  @Post('register')
  async register(@Body() body: AuthRegisterDTO) {
    return this.authService.register(body);
  }

  @Post('forget')
  async forget(@Body() { email }: AuthForgetDTO) {
    return this.authService.forget(email);
  }

  @Post('reset')
  async reset(@Body() { password, token }: AuthResetDTO) {
    return this.authService.reset(password, token);
  }

  @UseGuards(AuthGuard)
  @Post('me')
  async me(@User('email') email) {
    return { email };
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @Post('photo')
  async uploadPhoto(@User() user, @UploadedFile() photo: Express.Multer.File) {
    const path = join(
      __dirname,
      '..',
      '..',
      'storage',
      'photos',
      `photo-${user.id}.png`,
    );
    try {
      await this.fileService.upload(photo, path);
    } catch (e) {
      throw new BadRequestException(e);
    }
    return { sucess: true };
  }

  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(AuthGuard)
  @Post('photos')
  async uploadPhotos(
    @User() user,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    return { photos };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'photo',
        maxCount: 1,
      },
      {
        name: 'documents',
        maxCount: 10,
      },
    ]),
  )
  @UseGuards(AuthGuard)
  @Post('file-fields')
  async uploadFileFields(
    @User() user,
    @UploadedFiles()
    files: { photo: Express.Multer.File; documents: Express.Multer.File[] },
  ) {
    return files;
  }

  @Post('enc')
  async enc(@Body() data: CreateUserDTO) {
    return this.encryptService.encrypt(JSON.stringify(data));
  }

  @Post('dec')
  async dec(@Body() data: Buffer) {
    return this.encryptService.decrypt(data);
  }

  @Post('dec1')
  async dec1(@EncryptedPayload() data: CreateUserDTO) {
    return data;
  }
}
