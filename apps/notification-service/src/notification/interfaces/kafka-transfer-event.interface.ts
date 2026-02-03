export interface KafkaTransferEventInterface {
  fromUserId: string;
  fromUserLogin: string;
  toUserId: string;
  toUserLogin: string;
  amount: number;
  transactionId?: string;
  timestamp?: string;
}
