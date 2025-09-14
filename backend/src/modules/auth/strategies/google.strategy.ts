import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      throw new Error(
        'GoogleStrategy is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    if (!emails || !emails.length) {
      throw new UnauthorizedException('Google account does not have an email.');
    }

    const userPayload = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      provider: 'google',
      providerId: profile.id,
    };

    const user = await this.authService.validateOAuthUser(userPayload);
    if (!user) {
      throw new UnauthorizedException('Could not log in with Google.');
    }
    return user;
  }
}
