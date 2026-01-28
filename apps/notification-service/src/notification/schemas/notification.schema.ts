import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  senderUserId: string;

  @Prop({ required: true })
  senderLogin: string;

  @Prop({ required: true })
  receiverUserId: string;

  @Prop({ required: true })
  receiverLogin: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  transactionId?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
