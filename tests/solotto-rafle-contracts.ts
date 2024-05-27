import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolottoRafle } from "../target/types/solotto_rafle";
import {createMint,createAssociatedTokenAccount,mintTo,TOKEN_PROGRAM_ID} from "@solana/spl-token"
import {LAMPORTS_PER_SOL, SYSVAR_RECENT_BLOCKHASHES_PUBKEY, SYSVAR_RENT_PUBKEY} from '@solana/web3.js'


function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

describe("solotto-rafle-contracts", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolottoRafle as Program<SolottoRafle>;

  const ADMIN_KEYPAIR = anchor.web3.Keypair.generate();
  const TOKEN_KEYPAIR = anchor.web3.Keypair.generate();

  const USER_KEYPAIR = anchor.web3.Keypair.generate();
  const OTHER_USER_KEYPAIR = anchor.web3.Keypair.generate();
  
  const POOL_KEYPAIR=anchor.web3.Keypair.generate();
  const OTHER_POOL_KEYPAIR=anchor.web3.Keypair.generate();

  const USER_STAKE_KEYPAIR=anchor.web3.Keypair.generate();
  const OTHER_USER_STAKE_KEYPAIR = anchor.web3.Keypair.generate();

  var TokenMint;
  var otherTokenMint;
  var otherPoolTokenAccount;
  var poolTokenAccount;
  var userTokenAccount;
  var otherUserTokenAccount;


  it("Starting",async ()=>{
    
    let admin_sig = await program.provider.connection.requestAirdrop(
      ADMIN_KEYPAIR.publicKey,
      100000 * LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(admin_sig);
    await sleep(1000);
    let user_sig = await program.provider.connection.requestAirdrop(
      USER_KEYPAIR.publicKey,
      100000 * LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(user_sig);
    await sleep(1000);
    let other_user_sig = await program.provider.connection.requestAirdrop(
      OTHER_USER_KEYPAIR.publicKey,
      100000 * LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(other_user_sig);
    await sleep(1000);
    TokenMint=await createMint(
      program.provider.connection,
      ADMIN_KEYPAIR,
      ADMIN_KEYPAIR.publicKey,
      null,
      9,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    otherTokenMint=await createMint(
      program.provider.connection,
      ADMIN_KEYPAIR,
      ADMIN_KEYPAIR.publicKey,
      null,
      9,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    poolTokenAccount=await createAssociatedTokenAccount(
      program.provider.connection,
      ADMIN_KEYPAIR,
      TokenMint,
      ADMIN_KEYPAIR.publicKey,
    )

    otherPoolTokenAccount=await createAssociatedTokenAccount(
      program.provider.connection,
      ADMIN_KEYPAIR,
      otherTokenMint,
      ADMIN_KEYPAIR.publicKey,
    )

    userTokenAccount=await createAssociatedTokenAccount(
      program.provider.connection,
      USER_KEYPAIR,
      TokenMint,
      USER_KEYPAIR.publicKey,
    )

    otherUserTokenAccount=await createAssociatedTokenAccount(
      program.provider.connection,
      OTHER_USER_KEYPAIR,
      TokenMint,
      OTHER_USER_KEYPAIR.publicKey,
    )
    console.log("Other user token account!")

    await mintTo(
      program.provider.connection,
      ADMIN_KEYPAIR,
      TokenMint,
      userTokenAccount,
      ADMIN_KEYPAIR,
      1000
    )
    console.log("User mint")
    sleep(1000)

    await mintTo(
      program.provider.connection,
      ADMIN_KEYPAIR,
      TokenMint,
      otherUserTokenAccount,
      ADMIN_KEYPAIR,
      1000
    )
    console.log("Other User mint")
  })
  it("Is initialized!", async () => {
    // Add your test here.
    

    const tx = await program.methods.initialize().accounts({
      stakingPool:POOL_KEYPAIR.publicKey,
      poolTokenAccount:poolTokenAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent:SYSVAR_RENT_PUBKEY,
      user:ADMIN_KEYPAIR.publicKey
    })
    .signers([ADMIN_KEYPAIR,POOL_KEYPAIR])
    .rpc()
    console.log("✔ Staking pool initialized!", tx);

    const other_tx = await program.methods.initialize().accounts({
      stakingPool:OTHER_POOL_KEYPAIR.publicKey,
      poolTokenAccount:otherPoolTokenAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent:SYSVAR_RENT_PUBKEY,
      user:ADMIN_KEYPAIR.publicKey
    })
    .signers([ADMIN_KEYPAIR,OTHER_POOL_KEYPAIR])
    .rpc()
    console.log("✔ Staking pool initialized!", other_tx);
    const pools=await program.account.stakingPool.all();
    console.log(pools.length)

  });
  it("Staking...",async()=>{
    const stake_amount_int=100;
    const stake_amount=new anchor.BN(stake_amount_int);
    const tx = await program.methods.stake(stake_amount).accounts({
      stakingPool:POOL_KEYPAIR.publicKey,
      userTokenAccount:userTokenAccount,
      poolTokenAccount:poolTokenAccount,
      userStake:USER_STAKE_KEYPAIR.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent:SYSVAR_RENT_PUBKEY,
      user:USER_KEYPAIR.publicKey,
    })
    .signers([USER_KEYPAIR,USER_STAKE_KEYPAIR])
    .rpc()
    console.log(`✔ user staked ${stake_amount_int}!`, tx);

    const other_tx = await program.methods.stake(stake_amount).accounts({
      stakingPool:POOL_KEYPAIR.publicKey,
      userTokenAccount:otherUserTokenAccount,
      poolTokenAccount:poolTokenAccount,
      userStake:OTHER_USER_STAKE_KEYPAIR.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent:SYSVAR_RENT_PUBKEY,
      user:OTHER_USER_KEYPAIR.publicKey,
    })
    .signers([OTHER_USER_KEYPAIR,OTHER_USER_STAKE_KEYPAIR])
    .rpc()
    console.log(`✔ Other user staked  ${stake_amount_int}!`, other_tx);

  });
  it("Transfering....",async()=>{
    const transfer_amount_int=10;
    const transfer_amount=new anchor.BN(transfer_amount_int);
    const tx = await program.methods.transferStake(transfer_amount).accounts({
      senderStake:USER_STAKE_KEYPAIR.publicKey,
      receiverStake:OTHER_USER_STAKE_KEYPAIR.publicKey,
      sender:USER_KEYPAIR.publicKey,
    })
    .signers([USER_KEYPAIR])
    .rpc()
    console.log(`✔ Staked of ${transfer_amount_int}!`, tx);
    const userStakeAccount=await program.account.userStake.fetch(USER_STAKE_KEYPAIR.publicKey.toString());
    console.log(userStakeAccount)
  })
});
