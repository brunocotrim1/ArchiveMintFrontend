// block-visualizer.component.ts
import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MockBlockchainService } from '../services/blockchain.service';
import { Block, Transaction } from '../models/interface';
import { interval, Subscription } from 'rxjs';
import { trigger, style, transition, animate, query, stagger } from '@angular/animations';

@Component({
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, RouterLink
  ],
  selector: 'app-block-visualizer',
  template: `
    <mat-card class="blocks-card">
      <mat-card-header class="header">
        <mat-card-title>Blockchain Explorer</mat-card-title>
        <mat-card-subtitle>Real-time chain visualization & transactions</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content class="content-wrapper">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search by Hash</mat-label>
          <input matInput [(ngModel)]="searchHash" (ngModelChange)="filterBlocks()" placeholder="Enter block hash">
          <mat-icon matSuffix class="search-icon">search</mat-icon>
        </mat-form-field>

        <div class="visualizer-transactions-container">
          <div #blockchainContainer class="blockchain-container" (scroll)="onScroll($event)">
            <div class="blockchain-chain" [@pushAnimation]="filteredBlocks.length" [@.disabled]="!shouldAnimate">
              <div *ngFor="let block of filteredBlocks; let i = index" class="block-wrapper">
                <div class="block-cube" [routerLink]="['/blocks', block.height]" (click)="onBlockClick(block)"
                     [matTooltip]="'Block ' + block.height + '\nHash: ' + block.hash">
                  <div class="cube-face cube-front">
                    <h3 class="block-height">{{ block.height }}</h3>
                    <p class="block-hash">{{ block.hash | slice:0:10 }}...</p>
                    <p class="block-tx">{{ block.transactions.length }} Tx</p>
                    <button mat-raised-button class="view-btn" [routerLink]="['/blocks', block.height]">
                      <mat-icon>visibility</mat-icon> View
                    </button>
                  </div>
                  <div class="cube-face cube-back"></div>
                  <div class="cube-face cube-top"></div>
                  <div class="cube-face cube-bottom"></div>
                  <div class="cube-face cube-left"></div>
                  <div class="cube-face cube-right"></div>
                </div>
                <div class="block-connector" *ngIf="i < filteredBlocks.length - 1">
                  <svg class="chain-link" viewBox="0 0 50 40">
                    <path d="M 5 20 Q 15 10, 25 20 Q 35 30, 45 20" stroke="#66BB6A" stroke-width="2" fill="none" stroke-linecap="round"/>
                    <circle cx="15" cy="15" r="2.5" fill="#AED581"/>
                    <circle cx="35" cy="25" r="2.5" fill="#AED581"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="no-blocks" *ngIf="filteredBlocks.length === 0">
              <mat-icon>info</mat-icon>
              <p>No blocks found.</p>
            </div>
          </div>

          <div class="transactions-container">
            <h3>Recent Transactions</h3>
            <div class="transactions-list" *ngIf="recentTransactions.length > 0; else noTransactions"
                 [@txPushAnimation]="recentTransactions.length" [@.disabled]="!shouldAnimateTx">
              <div *ngFor="let tx of recentTransactions" class="transaction-item" (click)="onTransactionClick(tx)"
                   [matTooltip]="'TxID: ' + tx.transactionId">
                <p class="tx-id">{{ tx.transactionId | slice:0:10 }}...</p>
                <p class="tx-type">{{ tx.type }}</p>
              </div>
            </div>
            <ng-template #noTransactions>
              <div class="no-transactions">
                <mat-icon>info</mat-icon>
                <p>No transactions available.</p>
              </div>
            </ng-template>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .blocks-card {
      background: #FFFFFF;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #E0E0E0;
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
    }
    .header {
      padding: 1rem;
      background: #FAFAFA;
      border-bottom: 1px solid #E0E0E0;
      color: #333333;
    }
    mat-card-title {
      font-size: clamp(1.25rem, 4vw, 1.75rem);
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    mat-card-subtitle {
      font-size: clamp(0.85rem, 3vw, 1rem);
      color: #757575;
      font-weight: 400;
    }
    .content-wrapper {
      padding: 1rem;
      background: #FFFFFF;
    }
    .search-field {
      width: 100%;
      margin-bottom: 1rem;
      background: #F5F5F5;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .search-field mat-label { color: #757575; }
    .search-field input { color: #333333; }
    .search-icon { color: #66BB6A; transition: transform 0.3s ease; }
    .search-field:hover .search-icon { transform: scale(1.1); }
    .visualizer-transactions-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    .blockchain-container {
      width: 100%;
      padding: 1rem 1rem 2rem 1rem;
      overflow-x: auto;
      overflow-y: hidden;
      background: #FAFAFA;
      border-radius: 6px;
      border: 1px solid #E0E0E0;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
      display: flex; /* Added to support centering */
      justify-content: flex-start; /* Changed to flex-start for scrolling behavior */
      align-items: center; /* Ensure vertical centering */
      min-height: 150px; /* Ensure enough height for centering */
    }
    .blockchain-chain {
      display: inline-flex;
      align-items: center;
      justify-content: center; /* Center blocks horizontally within the chain */
      gap: 0.75rem;
      min-width: max-content;
      margin: 0 auto; /* Center the chain within the container */
    }
    .block-wrapper {
      display: inline-flex;
      align-items: center;
      perspective: 1000px;
      flex-shrink: 0;
    }
    .block-cube {
      position: relative;
      width: clamp(90px, 30vw, 105px);
      height: clamp(90px, 30vw, 105px);
      transform-style: preserve-3d;
      transform: rotateX(-20deg) rotateY(-20deg);
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      flex-shrink: 0;
    }
    .block-cube:hover {
      transform: rotateX(-25deg) rotateY(-25deg) scale(1.05);
      box-shadow: 0 6px 15px rgba(102, 187, 106, 0.2);
    }
    .cube-face {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 6px;
      box-sizing: border-box;
      border: 1.5px solid #66BB6A;
      background: linear-gradient(145deg, #FFFFFF 0%, #F5F5F5 100%);
    }
    .cube-front {
      padding: 0.5rem;
      text-align: center;
      transform: translateZ(52.5px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #333333;
      background: #FFFFFF;
      box-shadow: inset 0 0 7.5px rgba(102, 187, 106, 0.1);
    }
    .cube-back { transform: translateZ(-52.5px) rotateY(180deg); opacity: 0.8; }
    .cube-top { transform: rotateX(90deg) translateZ(52.5px); background: linear-gradient(145deg, #AED581 0%, #FFFFFF 100%); opacity: 0.9; }
    .cube-bottom { transform: rotateX(-90deg) translateZ(52.5px); opacity: 0.8; }
    .cube-left { transform: rotateY(-90deg) translateZ(52.5px); opacity: 0.8; }
    .cube-right { transform: rotateY(90deg) translateZ(52.5px); opacity: 0.8; }
    .block-height {
      font-size: clamp(0.75rem, 2.25vw, 0.9375rem);
      font-weight: 600;
      color: #66BB6A;
      margin: 0;
    }
    .block-hash, .block-tx {
      font-size: clamp(0.5625rem, 1.5vw, 0.6375rem);
      color: #424242;
      word-break: break-all;
      margin: 0.1875rem 0;
    }
    .block-tx { color: #757575; }
    .view-btn {
      padding: 0.225rem 0.375rem;
      font-size: clamp(0.5625rem, 1.5vw, 0.6375rem);
      background: #66BB6A;
      color: #FFFFFF;
      border-radius: 3px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.1875rem;
      width: fit-content;
      margin: 0 auto;
    }
    .view-btn mat-icon {
      font-size: clamp(0.675rem, 1.875vw, 0.75rem);
      height: 0.75rem;
      width: 0.75rem;
    }
    .view-btn:hover {
      background: #AED581;
      transform: scale(1.05);
    }
    .block-connector {
      width: clamp(22.5px, 7.5vw, 37.5px);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .chain-link {
      width: 100%;
      height: 30px;
      transition: transform 0.3s ease;
    }
    .block-cube:hover + .block-connector .chain-link { transform: scale(1.1); }
    .no-blocks, .no-transactions {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: #757575;
      background: #F5F5F5;
      border-radius: 6px;
      margin: 0.5rem;
      width: 100%;
      box-sizing: border-box;
    }
    .no-blocks mat-icon, .no-transactions mat-icon {
      margin-right: 0.5rem;
      color: #FFB300;
      font-size: 1.25rem;
      height: 1.25rem;
      width: 1.25rem;
    }
    .no-blocks p, .no-transactions p {
      font-size: clamp(0.9rem, 3vw, 1rem);
      margin: 0;
    }
    .transactions-container {
      width: 100%;
      padding: 1rem;
      background: #FAFAFA;
      border-radius: 6px;
      border: 1px solid #E0E0E0;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      min-height: 200px;
    }
    .transactions-container h3 {
      font-size: clamp(1rem, 3.5vw, 1.25rem);
      font-weight: 500;
      color: #66BB6A;
      margin: 0 0 0.75rem 0;
    }
    .transactions-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
      padding-right: 0.5rem;
      scrollbar-width: thin;
      scrollbar-color: #66BB6A #F5F5F5;
    }
    .transactions-list::-webkit-scrollbar { width: 6px; }
    .transactions-list::-webkit-scrollbar-track { background: #F5F5F5; border-radius: 3px; }
    .transactions-list::-webkit-scrollbar-thumb { background: #66BB6A; border-radius: 3px; }
    .transaction-item {
      background: #FFFFFF;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #E0E0E0;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
      box-sizing: border-box;
    }
    .transaction-item:hover {
      background: #F5F5F5;
      border-color: #66BB6A;
      transform: translateX(3px);
    }
    .tx-id, .tx-type {
      font-size: clamp(0.8rem, 2.5vw, 0.9rem);
      margin: 0;
      word-break: break-all;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tx-id { color: #424242; }
    .tx-type { color: #757575; }
    @media (min-width: 768px) {
      .content-wrapper, .header { padding: 1.5rem 2rem; }
      .visualizer-transactions-container { flex-direction: row; gap: 2rem; height: 250px; }
      .blockchain-container { 
        flex: 1; 
        padding: 1.5rem; /* Balanced padding for centering */
        justify-content: flex-start; /* Ensure scrolling works */
        min-height: 180px; /* Adjusted for smaller blocks */
      }
      .blockchain-chain { gap: 1rem; } /* Slightly larger gap for larger screens */
      .transactions-container { width: 400px; height: 100%; }
      .block-cube { width: 105px; height: 105px; }
      .block-connector { width: 37.5px; }
    }
    @media (max-width: 767px) {
      .block-cube { transform: rotateX(0deg) rotateY(0deg); }
      .block-cube:hover { transform: scale(1.05); }
      .cube-front { transform: translateZ(0); }
      .cube-back, .cube-top, .cube-bottom, .cube-left, .cube-right { display: none; }
      .blockchain-chain { gap: 0.375rem; }
      .block-connector { width: 22.5px; }
      .visualizer-transactions-container { height: auto; }
      .blockchain-container, .transactions-container { padding: 0.5rem; }
      .content-wrapper, .header { padding: 0.75rem; }
      .blockchain-container { 
        padding: 0.5rem; 
        min-height: 120px; /* Adjusted for smaller blocks */
      }
    }
    @media (max-width: 480px) {
      .block-cube { width: clamp(75px, 26.25vw, 90px); height: clamp(75px, 26.25vw, 90px); }
      .block-height { font-size: clamp(0.675rem, 1.875vw, 0.75rem); }
      .block-hash, .block-tx { font-size: clamp(0.4875rem, 1.5vw, 0.5625rem); }
      .view-btn { font-size: clamp(0.4875rem, 1.5vw, 0.5625rem); }
      .view-btn mat-icon { font-size: clamp(0.6rem, 1.5vw, 0.675rem); }
      .tx-id, .tx-type { font-size: clamp(0.7rem, 2vw, 0.8rem); }
      .transactions-container h3 { font-size: clamp(0.9rem, 3vw, 1rem); }
    }
  `],
  animations: [
    trigger('pushAnimation', [
      transition(':increment', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-150px) rotateY(90deg)' }),
          stagger(120, [
            animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0) rotateY(0deg)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('txPushAnimation', [
      transition(':increment', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-20px) scale(0.9)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class BlockVisualizerComponent implements OnInit, OnDestroy {
  allBlocks: Block[] = [];
  filteredBlocks: Block[] = [];
  recentTransactions: Transaction[] = [];
  searchHash = '';
  limit = 10;
  maxTransactions = 10;
  shouldAnimate = false;
  shouldAnimateTx = false;
  private blockchainService = inject(MockBlockchainService);
  private router = inject(Router);
  private pollSubscription: Subscription | null = null;
  private isLoading = false;

  @ViewChild('blockchainContainer') blockchainContainer!: ElementRef;

  async ngOnInit() {
    const blocks = await this.blockchainService.getBlocks(this.limit) ?? [];
    this.allBlocks = blocks.sort((a, b) => b.height - a.height);
    this.filteredBlocks = [...this.allBlocks];
    this.updateRecentTransactions();
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.pollSubscription) this.pollSubscription.unsubscribe();
  }

  private startPolling() {
    this.pollSubscription = interval(15000).subscribe(async () => {
      try {
        const latestBlocks = await this.blockchainService.getBlocks(3);
        if (latestBlocks && latestBlocks.length > 0) {
          const sortedLatestBlocks = latestBlocks.sort((a, b) => a.height - b.height);
          const currentLatestHeight = this.allBlocks[0]?.height ?? -1;

          const hasNewBlocks = sortedLatestBlocks.some(block => block.height > currentLatestHeight);
          if (hasNewBlocks) this.shouldAnimate = true;

          for (const block of sortedLatestBlocks) {
            if (block.height > currentLatestHeight) this.allBlocks.unshift(block);
          }

          const previousTxCount = this.recentTransactions.length;
          this.filterBlocks();
          this.updateRecentTransactions();
          if (this.recentTransactions.length > previousTxCount) this.shouldAnimateTx = true;

          if (hasNewBlocks || this.shouldAnimateTx) {
            setTimeout(() => {
              this.shouldAnimate = false;
              this.shouldAnimateTx = false;
            }, 600);
          }
        }
      } catch (error) {
        console.error('Error polling latest blocks:', error);
      }
    });
  }

  filterBlocks(): void {
    this.recentTransactions = [];
    const searchTerm = this.searchHash.trim().toLowerCase();
    this.filteredBlocks = searchTerm === '' ? [...this.allBlocks] : this.allBlocks.filter(block => block.hash.toLowerCase().includes(searchTerm));
    this.updateRecentTransactions();
  }

  onBlockClick(block: Block): void {
    this.router.navigate(['/blocks', block.height]);
  }

  async onScroll(event: Event): Promise<void> {
    if (this.isLoading || this.searchHash) return;
    const element = this.blockchainContainer.nativeElement;
    const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 50;
    if (atEnd) await this.loadNextBlock();
  }

  private async loadNextBlock(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;
    try {
      const oldestHeight = this.allBlocks[this.allBlocks.length - 1]?.height ?? 0;
      const nextHeight = oldestHeight - 1;
      if (nextHeight >= 0) {
        const block = await this.blockchainService.getBlock(nextHeight);
        if (block) {
          this.allBlocks.push(block);
          this.filterBlocks();
        }
      }
    } catch (error) {
      console.error('Error loading next block:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private updateRecentTransactions(): void {
    const includedTransactionIds = new Set<string>();
    const tempTransactions: Transaction[] = [];
    const blocksToCheck = this.filteredBlocks.slice(0, Math.min(6, this.filteredBlocks.length));
    for (const block of blocksToCheck) {
      if (block?.transactions?.length > 0) {
        for (const transaction of block.transactions) {
          if (transaction.transactionId && !includedTransactionIds.has(transaction.transactionId)) {
            tempTransactions.push(transaction);
            includedTransactionIds.add(transaction.transactionId);
            if (tempTransactions.length >= this.maxTransactions) break;
          }
        }
        if (tempTransactions.length >= this.maxTransactions) break;
      }
    }
    this.recentTransactions = tempTransactions;
  }

  onTransactionClick(tx: Transaction): void {
    const containingBlock = this.filteredBlocks.find(block => block.transactions.some(t => t.transactionId === tx.transactionId));
    if (containingBlock) {
      this.router.navigate(['/transactions', tx.transactionId], { state: { block: containingBlock } });
    } else {
      console.error('No block found containing transaction:', tx.transactionId);
    }
  }
}