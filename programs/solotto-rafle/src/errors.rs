use anchor_lang::prelude::*;

#[error_code]
pub enum SolottoRafleError {
    #[msg("Insufficient funds.")]
    InsufficientFunds,
    #[msg("Insufficient pool funds.")]
    InsufficientPoolFunds,
    #[msg("Insufficient user stake.")]
    InsufficientUserStake,
    #[msg("Invalid amount.")]
    InvalidAmount,
}
