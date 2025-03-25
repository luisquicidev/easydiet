import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DietCalculation } from './diet-calculation.entity';

@Entity('diet_calculation_formulas')
export class DietCalculationFormula {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    calculationId: string;

    @Column()
    formulaName: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    formulaValue: number;

    // Relacionamento

    @ManyToOne(() => DietCalculation, calculation => calculation.formulas)
    @JoinColumn({ name: 'calculation_id' })
    calculation: DietCalculation;
}