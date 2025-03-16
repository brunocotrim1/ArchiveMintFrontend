import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MockBlockchainService } from '../services/blockchain.service';
import { StorageContract, FileProvingWindow } from '../models/interface';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink
  ],
  selector: 'app-storage-contract-details',
  template: `
    <mat-card class="contract-details-card">
      <mat-card-header class="header">
        <mat-card-title>Storage Contract Details</mat-card-title>
        <mat-card-subtitle>File URL: {{ storageContract?.fileUrl || 'N/A' }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content class="content">
        <ng-container *ngIf="storageContract; else notFoundTemplate">
          <div class="details-container">
            <div class="detail-group">
              <div class="detail-item">
                <span class="label">File URL</span>
                <span class="value scrollable">{{ storageContract.fileUrl }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Storer Address</span>
                <span class="value scrollable">{{ storageContract.storerAddress }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Merkle Root</span>
                <span class="value scrollable">{{ storageContract.merkleRoot }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Timestamp</span>
                <span class="value">{{ storageContract.timestamp | date:'medium' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Value</span>
                <span class="value">{{ storageContract.value }} Coins</span>
              </div>
              <div class="detail-item">
                <span class="label">Proof Frequency</span>
                <span class="value">{{ storageContract.proofFrequency }} blocks</span>
              </div>
              <div class="detail-item">
                <span class="label">Window Size</span>
                <span class="value">{{ storageContract.windowSize }} blocks</span>
              </div>
              <div class="detail-item">
                <span class="label">File Length</span>
                <span class="value">{{ formatFileLength(storageContract.fileLength) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Storage Type</span>
                <span class="value">{{ storageContract.storageType }}</span>
              </div>
              <div class="detail-item" *ngIf="storageContract.fccnSignature">
                <span class="label">FCCN Signature</span>
                <span class="value scrollable">{{ storageContract.fccnSignature }}</span>
              </div>
              <div class="detail-item" *ngIf="storageContract.storerSignature">
                <span class="label">Storer Signature</span>
                <span class="value scrollable">{{ storageContract.storerSignature }}</span>
              </div>
            </div>

            <mat-divider class="divider"></mat-divider>

            <h3 class="section-title">File Proving Windows ({{ fileProvingWindows.length }})</h3>
            <div class="proving-windows-container">
              <div *ngIf="fileProvingWindows.length > 0; else noWindows" class="proving-windows-list">
                <div *ngFor="let window of fileProvingWindows" class="proving-window-item" [ngClass]="window.state.toLowerCase()">
                  <div class="window-detail">
                    <span class="label">PoDP Challenge</span>
                    <span class="value scrollable">{{ window.poDpChallenge }}</span>
                  </div>
                  <div class="window-detail">
                    <span class="label">Start Block Index</span>
                    <span class="value">{{ window.startBlockIndex }}</span>
                  </div>
                  <div class="window-detail">
                    <span class="label">End Block Index</span>
                    <span class="value">{{ window.endBlockIndex }}</span>
                  </div>
                  <div class="window-detail">
                    <span class="label">State</span>
                    <span class="value">{{ window.state }}</span>
                  </div>
                </div>
              </div>
              <ng-template #noWindows>
                <div class="no-windows">
                  <mat-icon>info</mat-icon>
                  <p>No file proving windows found.</p>
                </div>
              </ng-template>
            </div>
          </div>
        </ng-container>

        <ng-template #notFoundTemplate>
          <div class="not-found">
            <mat-icon>error_outline</mat-icon>
            <p>Storage contract not found</p>
          </div>
        </ng-template>
      </mat-card-content>

      <mat-card-actions class="actions">
        <button mat-raised-button class="back-btn" [routerLink]="['/storageContracts']">
          <mat-icon>arrow_back</mat-icon> Back to Storage Contracts
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
      padding: 0.75rem;
      background: #F7FAFC; /* Softer gray background */
    }

    .contract-details-card {
      max-width: 900px;
      margin: 1rem auto;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0; /* Softer gray border */
      overflow: hidden;
    }

    .header {
      padding: 0.75rem;
      background: #F7FAFC;
      border-bottom: 1px solid #E2E8F0;
      color: #4A4A4A;
    }

    mat-card-title {
      font-size: clamp(1.25rem, 4vw, 1.5rem);
      font-weight: 500;
      margin-bottom: 0.25rem;
      color: #4A4A4A;
    }

    mat-card-subtitle {
      font-size: clamp(0.8rem, 2.5vw, 0.9rem);
      color: #6B7280;
      font-weight: 400;
    }

    .content {
      padding: 0.75rem;
    }

    .details-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      padding: 0.5rem;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .detail-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: #EDF2F7;
    }

    .label {
      font-size: clamp(0.75rem, 2vw, 0.85rem);
      font-weight: 500;
      color: #2F855A;
      margin-bottom: 0.25rem;
    }

    .value {
      font-size: clamp(0.8rem, 2vw, 0.9rem);
      color: #4A4A4A;
      word-break: break-word;
      line-height: 1.4;
    }

    /* Add scrollable class for horizontally scrollable values */
    .scrollable {
      overflow-x: auto;
      white-space: nowrap;
      max-width: 100%;
      scrollbar-width: thin;
      scrollbar-color: #2F855A #F7FAFC;
    }

    .scrollable::-webkit-scrollbar {
      height: 6px;
    }

    .scrollable::-webkit-scrollbar-track {
      background: #F7FAFC;
      border-radius: 3px;
    }

    .scrollable::-webkit-scrollbar-thumb {
      background: #2F855A;
      border-radius: 3px;
    }

    .divider {
      margin: 1rem 0;
      background-color: #E2E8F0;
    }

    .section-title {
      font-size: clamp(1rem, 3.5vw, 1.25rem);
      font-weight: 500;
      color: #2F855A;
      margin: 0 0 0.5rem 0;
    }

    .proving-windows-container {
      max-height: 300px;
      overflow-y: auto;
      padding-right: 0.5rem;
      scrollbar-width: thin;
      scrollbar-color: #2F855A #F7FAFC;
    }

    .proving-windows-container::-webkit-scrollbar {
      width: 6px;
    }

    .proving-windows-container::-webkit-scrollbar-track {
      background: #F7FAFC;
      border-radius: 3px;
    }

    .proving-windows-container::-webkit-scrollbar-thumb {
      background: #2F855A;
      border-radius: 3px;
    }

    .proving-windows-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .proving-window-item {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .proving-window-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .proving-window-item.pending {
      background: #FEF3C7; /* Soft yellow for PENDING */
    }

    .proving-window-item.proving {
      background: #DBEAFE; /* Soft blue for PROVING */
    }

    .proving-window-item.proved {
      background: #DCFCE7; /* Soft green for PROVED */
    }

    .proving-window-item.failed {
      background: #FEE2E2; /* Soft red for FAILED */
    }

    .window-detail {
      display: flex;
      flex-direction: column;
    }

    .no-windows {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0.75rem;
      background: #F7FAFC;
      border-radius: 6px;
      color: #6B7280;
    }

    .no-windows mat-icon {
      color: #F6AD55;
      font-size: 1.25rem;
      height: 1.25rem;
      width: 1.25rem;
    }

    .no-windows p {
      margin: 0;
      font-size: clamp(0.85rem, 2.5vw, 0.95rem);
      color: #6B7280;
    }

    .not-found {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0.75rem;
      background: #F7FAFC;
      border-radius: 6px;
      color: #6B7280;
    }

    .not-found mat-icon {
      color: #F6AD55;
      font-size: 1.25rem;
      height: 1.25rem;
      width: 1.25rem;
    }

    .not-found p {
      margin: 0;
      font-size: clamp(0.85rem, 2.5vw, 0.95rem);
      color: #6B7280;
    }

    .actions {
      padding: 0.75rem;
      background: #F7FAFC;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: flex-end;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.3rem 0.5rem;
      font-size: clamp(0.75rem, 2vw, 0.85rem);
      font-weight: 500;
      background: #2F855A;
      color: #FFFFFF;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: #38A169;
      transform: scale(1.05);
    }

    .back-btn mat-icon {
      font-size: 1rem;
      height: 1rem;
      width: 1rem;
      color: #FFFFFF;
    }

    @media (max-width: 768px) {
      :host {
        padding: 0.5rem;
      }

      .contract-details-card {
        margin: 0.75rem auto;
      }

      .header, .content, .actions {
        padding: 0.5rem;
      }

      .detail-group, .proving-window-item {
        grid-template-columns: 1fr;
      }

      mat-card-title {
        font-size: clamp(1rem, 3.5vw, 1.25rem);
      }

      .section-title {
        font-size: clamp(0.9rem, 3vw, 1rem);
      }

      .label {
        font-size: clamp(0.7rem, 2vw, 0.8rem);
      }

      .value, .not-found p, .no-windows p {
        font-size: clamp(0.75rem, 2vw, 0.85rem);
      }
    }

    @media (max-width: 480px) {
      :host {
        padding: 0.25rem;
      }

      .contract-details-card {
        margin: 0.5rem auto;
      }

      .back-btn {
        font-size: clamp(0.65rem, 2vw, 0.75rem);
      }

      .back-btn mat-icon {
        font-size: 0.9rem;
        height: 0.9rem;
        width: 0.9rem;
      }
    }
  `]
})
export class StorageContractDetailsComponent implements OnInit {
  storageContract: StorageContract | null = null;
  fileProvingWindows: FileProvingWindow[] = [];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private blockchainService = inject(MockBlockchainService);

  async ngOnInit() {
    // Retrieve contractHash and fileUrl as query parameters
    const contractHash = this.route.snapshot.queryParamMap.get('contractHash');
    const fileUrl = this.route.snapshot.queryParamMap.get('fileUrl');
    if (contractHash && fileUrl) {
      await this.fetchStorageContract(contractHash, fileUrl);
      await this.fetchFileProvingWindows(contractHash);
    }
  }

  async fetchStorageContract(contractHash: string, fileUrl: string) {
    try {
      const response = await this.blockchainService.getStorageContract(contractHash, fileUrl);
      this.storageContract = response;
    } catch (error) {
      console.error('Error fetching storage contract:', error);
      this.storageContract = null;
    }
  }

  async fetchFileProvingWindows(contractHash: string) {
    try {
      const response = await this.blockchainService.getContractFileProvingWindows(contractHash);
      this.fileProvingWindows = response || [];
    } catch (error) {
      console.error('Error fetching file proving windows:', error);
      this.fileProvingWindows = [];
    }
  }

  formatFileLength(bytes: number): string {
    if (bytes <= 0) return '0 Bytes';
    
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }

    return unitIndex === 0 
      ? `${Math.round(value)} ${units[unitIndex]}`
      : `${value.toFixed(2)} ${units[unitIndex]}`;
  }
}