import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { UserActivity } from './user-activity.entity';

@Entity('met_references')
export class MetReference {
    @PrimaryColumn()
    code: string;

    @Column()
    description: string;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
    })
    metValue: number;

    @Column({ nullable: true })
    category: string;

    @OneToMany(() => UserActivity, activity => activity.metReference)
    activities: UserActivity[];
}