import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_met_calculations')
export class UserMetCalculation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({
        type: 'decimal',
        precision: 8,
        scale: 2,
        name: 'totalMet'
    })
    totalMet: number;

    @Column({
        type: 'decimal',
        precision: 3,
        scale: 2,
        name: 'activityLevel'
    })
    activityLevel: number;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        name: 'calculationDate'
    })
    calculationDate: Date;

    @Column({
        default: true,
        name: 'isCurrent'
    })
    isCurrent: boolean;

    @ManyToOne(() => User, user => user.metCalculations)
    @JoinColumn({ name: 'user_id' })
    user: User;
}