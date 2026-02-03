import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserAvatar } from '../../avatar/entities/avatar.entity';

@Entity()
@Index(['age', 'deletedAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  login: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  age: number;

  @Column()
  description: string;

  @Column({ nullable: true })
  refreshToken: string;

  @OneToMany(() => UserAvatar, (avatar) => avatar.user)
  avatars: UserAvatar[];

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0.0,
  })
  balance: number;

  @DeleteDateColumn()
  deletedAt?: Date;
}
