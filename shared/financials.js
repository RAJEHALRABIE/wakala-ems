import { Decimal } from "decimal.js";
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
export function calculateFinancials(input) {
    const area = new Decimal(input.areaSqm || 0);
    const expectedRate = new Decimal(input.expectedCompensationPerSqm || 0);
    const possession = new Decimal(input.possessionRatio || 1);
    const baseFeePercent = new Decimal(input.baseFeePercentage || 0);
    const damageComp = new Decimal(input.damageToRemainingComp || 0);
    const extraRate = new Decimal(input.extraCompRate || 0);
    const officialAmount = new Decimal(input.officialCompensationAmount || 0);
    const improvements = new Decimal(input.improvementValue || 0);
    const land_base = area.mul(expectedRate).mul(possession);
    const extra_amount = land_base.mul(extraRate.div(100));
    const expected_total = land_base.add(damageComp).add(extra_amount).add(improvements);
    const official_total = officialAmount;
    const report_total = expected_total; // Assuming report_total is the same as expected_total for now
    const uplift_base = Decimal.max(0, official_total.sub(expected_total));
    const fee_base = land_base.mul(baseFeePercent.div(100));
    const success_fee = uplift_base.mul(0.25); // Assuming 25% success fee on uplift
    return {
        land_base: land_base.toFixed(2),
        uplift_base: uplift_base.toFixed(2),
        extra_amount: extra_amount.toFixed(2),
        expected_total: expected_total.toFixed(2),
        official_total: official_total.toFixed(2),
        report_total: report_total.toFixed(2),
        fee_base: fee_base.toFixed(2),
        success_fee: success_fee.toFixed(2),
    };
}
