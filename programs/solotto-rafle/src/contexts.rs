use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, Transfer, TokenAccount};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub pool_token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(init, payer = user, space = 8 + 8)]
    pub user_stake: Account<'info, UserStake>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    /// CHECK:
    #[account(mut)]
    pub pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_stake: Account<'info, UserStake>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferStake<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub receiver_stake: Account<'info, UserStake>,
}


#[account]
pub struct StakingPool {
    pub total_staked: u64,
}

#[account]
pub struct UserStake {
    pub amount: u64,
}