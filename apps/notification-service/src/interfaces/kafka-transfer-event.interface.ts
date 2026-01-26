export interface KafkaTransferEventInterface {
  fromUserId: string;
  toUserId: string;
  fromUserLogin: string;
  toUserLogin: string;
  amount: number;
  transactionId?: string;
  timestamp?: string;
}
