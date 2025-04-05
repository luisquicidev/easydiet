import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { DietMealAlternative } from './diet-meal-alternative.entity';

@Entity('diet_meal_alternative_foods')
export class DietMealAlternativeFood {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({name: 'alternative_id'})
    alternativeId: string;

    @Column()
    name: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    grams: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    protein: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    carbs: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    fat: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    calories: number;

    @Column()
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    // Relacionamento

    @ManyToOne(() => DietMealAlternative, alternative => alternative.foods)
    @JoinColumn({ name: 'alternative_id' })
    alternative: DietMealAlternative;
}