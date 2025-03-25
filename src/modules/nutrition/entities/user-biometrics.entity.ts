import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_biometrics')
export class UserBiometrics {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
    })
    weight: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
    })
    height: number;

    @Column()
    age: number;

    @Column()
    gender: string;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
        name: 'leanMass'
    })
    leanMass: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, user => user.biometrics)
    @JoinColumn({ name: 'user_id' })
    user: User;
}