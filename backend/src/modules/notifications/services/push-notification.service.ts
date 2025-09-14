import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

admin.initializeApp();

@Injectable()
export class PushNotificationService {
  sendTestPush(testData: any): any {
    throw new Error('Method not implemented.');
  }
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }
}