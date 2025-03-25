import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FoodPreferenceType {
    PREFERENCE = 'preference',
    RESTRICTION = 'restriction',
    ALLERGY = 'allergy',
}

@Entity('user_food_preferences')
export class UserFoodPreference {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({
        type: 'enum',
        enum: FoodPreferenceType,
    })
    type: FoodPreferenceType;

    @Column({ type: 'text' })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    // Novos campos para informações nutricionais
    @Column({ nullable: true, name: 'external_id' })
    externalId: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    calories: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    carbohydrates: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    proteins: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    fats: number;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: true
    })
    source: string;

    @ManyToOne(() => User, user => user.foodPreferences)
    @JoinColumn({ name: 'user_id' })
    user: User;
}