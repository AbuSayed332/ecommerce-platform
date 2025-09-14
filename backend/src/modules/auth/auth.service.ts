import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
// Remove EmailService import or create the service

type UserDocument = User & Document;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    // private emailService: EmailService, // Add when service is available
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).select('+password').exec(); // Include password in result

    // User might not have a password if they signed up via OAuth
    if (!user || !user.password) {
      return null;
    }

    // Check if the user's account is active before checking the password
    if (user.status !== 'active') {
      throw new ForbiddenException(`Your account is currently ${user.status}. Please contact support.`);
    }

    if (await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    this.logger.log(`User logging in: ${user.email} (ID: ${user._id})`);
    const payload = {
      sub: user._id?.toString() || user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel
      .findOne({ email: registerDto.email })
      .exec();

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = new this.userModel({
      ...registerDto,
      password: hashedPassword,
    });

    await user.save();
    const { password, ...result } = user.toObject();

    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      const user = await this.userModel.findById(id).exec();
      return user ? user.toObject() as User : null;
    } catch (error) {
      return null;
    }
  }

  async validateOAuthUser(payload: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    provider: string;
    providerId: string;
  }): Promise<any> {
    const { provider, providerId, email, firstName, lastName, picture } = payload;

    // 1. Find user by provider and providerId
    const userByProvider = await this.userModel.findOne({ provider, providerId }).exec();
    if (userByProvider) {
      return userByProvider;
    }

    // 2. If not found, find by email and link account
    const userByEmail = await this.userModel.findOne({ email }).exec();
    if (userByEmail) {
      // This user exists but logged in with another method. Link the account.
      userByEmail.provider = provider;
      userByEmail.providerId = providerId;
      if (!userByEmail.picture) {
        userByEmail.picture = picture;
      }
      await userByEmail.save();
      return userByEmail;
    }

    // 3. If no user found, create a new one.
    const newUser = new this.userModel({
      email,
      firstName,
      lastName,
      picture,
      provider,
      providerId,
      isEmailVerified: true, // Email from OAuth provider is considered verified
      status: 'active',
    });

    return newUser.save();
  }
}