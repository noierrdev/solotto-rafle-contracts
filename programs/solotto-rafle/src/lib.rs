use anchor_lang::prelude::*;
use anchor_lang::solana_program::{clock, sysvar};
use anchor_spl::token::spl_token;
use anchor_spl::token::{self,  Token, Transfer};
use crate::contexts::*;
use crate::errors::*;

pub mod contexts;
pub mod errors;

declare_id!("CVJwPBbBwcdmFJtHZQVzc9czXLyG5iHFshs5iZ1KBoQv");

#[program]
pub mod solotto_rafle {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        staking_pool.total_staked = 0;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        let user_stake = &mut ctx.accounts.user_stake;
        // Transfer tokens from user to pool
        // let cpi_accounts = Transfer {
        //     from: ctx.accounts.user_token_account.to_account_info(),
        //     to: ctx.accounts.pool_token_account.to_account_info(),
        //     authority: ctx.accounts.user.to_account_info(),
        // };
        // let cpi_program = ctx.accounts.token_program.to_account_info();
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // token::transfer(cpi_ctx, amount)?;

        if amount == 0 {
            return Err(SolottoRafleError::InvalidAmount.into());
        }

        if ctx.accounts.user_token_account.amount < amount {
            return Err(SolottoRafleError::InsufficientFunds.into());
        }

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(), //todo use user account as signer
            },
        );
        token::transfer(cpi_ctx, amount)?;

        staking_pool.total_staked += amount;
        user_stake.amount += amount;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        let user_stake = &mut ctx.accounts.user_stake;

        if user_stake.amount < amount {
            return Err(SolottoRafleError::InsufficientUserStake.into());
        }

        // Transfer tokens from pool to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        staking_pool.total_staked -= amount;
        user_stake.amount -= amount;
        Ok(())
    }

    pub fn transfer_stake(ctx: Context<TransferStake>, amount: u64) -> Result<()> {
        let sender_stake = &mut ctx.accounts.sender_stake;
        let receiver_stake = &mut ctx.accounts.receiver_stake;

        if sender_stake.amount < amount {
            return Err(SolottoRafleError::InsufficientUserStake.into());
        }

        sender_stake.amount -= amount;
        receiver_stake.amount += amount;

        Ok(())
    }


}

