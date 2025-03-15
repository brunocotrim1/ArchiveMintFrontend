import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Block, Transaction, WalletBalance, StorageContract } from '../models/interface';
import { environment } from '../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export abstract class BlockchainService {
  abstract getBlocks(limit?: number): Promise<Block[]>;
  abstract getWalletBalances(): Promise<WalletBalance[]>;
  abstract getStoredFiles(): Promise<string[]>;
  abstract getStorageContracts(fileName: string): Promise<StorageContract[]>;
  abstract getStorageContractsChunk(fileName: string, offset: number, limit: number): Promise<StorageContract[]>;
  abstract sendTransaction(transaction: Transaction): Promise<string>;
  abstract sendBlock(block: Block): Promise<string>;
  abstract archiveFile(file: any, data: any): Promise<string>;
  abstract getMinedCoins(): Promise<HashMap<string, string>>;
  abstract getArchivedStorage(): Promise<string>;
  abstract getTotalAmountOfContracts(): Promise<string>;
  abstract getTotalAmountOfCoins(): Promise<string>;
}

@Injectable({
  providedIn: 'root'
})
export class MockBlockchainService extends BlockchainService {
  private backendUrl = environment.backendUrl;

  constructor(private http: HttpClient) {
    super();
  }

  async getBlocks(limit?: number): Promise<Block[]> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }
    try {
      const response = await this.http.get<Block[]>(`${this.backendUrl}/explorer/getBlocks`, { params }).toPromise();
      return response ?? [];
    } catch (error) {
      console.error('Error fetching blocks:', error);
      throw error;
    }
  }

  async getWalletBalances(): Promise<WalletBalance[]> {
    try {
      const response = await this.http.get<WalletBalance[]>(`${this.backendUrl}/explorer/walletBalances`).toPromise();
      return response ?? [];
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      throw error;
    }
  }

  async getStoredFiles(): Promise<string[]> {
    try {
      const response = await this.http.get<string[]>(`${this.backendUrl}/explorer/storedFiles`).toPromise();
      return response ?? [];
    } catch (error) {
      console.error('Error fetching stored files:', error);
      throw error;
    }
  }

  async getStorageContracts(fileName: string): Promise<StorageContract[]> {
    const params = new HttpParams().set('fileName', fileName);
    try {
      const response = await this.http.get<StorageContract[]>(`${this.backendUrl}/explorer/storageContracts`, { params }).toPromise();
      return response ?? [];
    } catch (error) {
      console.error('Error fetching storage contracts:', error);
      throw error;
    }
  }

  async getStorageContractsChunk(fileName: string, offset: number, limit: number): Promise<StorageContract[]> {
    let params = new HttpParams()
      .set('fileName', fileName)
      .set('offset', offset.toString())
      .set('limit', limit.toString());
    try {
      const response = await this.http.get<StorageContract[]>(`${this.backendUrl}/explorer/storageContractsChunk`, { params }).toPromise();
      return response ?? [];
    } catch (error) {
      console.error('Error fetching storage contracts chunk:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const response = await this.http.post<string>(`${this.backendUrl}/explorer/transactions`, transaction).toPromise();
      return response ?? 'Transaction accepted';
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async sendBlock(block: Block): Promise<string> {
    try {
      const response = await this.http.post<string>(`${this.backendUrl}/explorer/blocks`, block).toPromise();
      return response ?? 'Block accepted';
    } catch (error) {
      console.error('Error sending block:', error);
      throw error;
    }
  }

  async getBlock(height: number): Promise<Block | null> {
    try {
      let params = new HttpParams();
      params = params.set('index', height.toString());
      const response = await this.http.get<Block>(`${this.backendUrl}/explorer/getBlock`, { params }).toPromise();
      return response ?? null;
    } catch (error) {
      console.error('Error fetching block:', error);
      throw error;
    }
  }

  async archiveFile(file: any, data: any): Promise<string> {
    const payload = { file, data };
    try {
      const response = await this.http.post<string>(`${this.backendUrl}/explorer/archive`, payload).toPromise();
      return response ?? 'File archived successfully';
    } catch (error) {
      console.error('Error archiving file:', error);
      throw error;
    }
  }

  async getMinedCoins(): Promise<HashMap<string, string>> {
    try {
      const response = await this.http.get<HashMap<string, string>>(`${this.backendUrl}/explorer/minedCoins`).toPromise();
      return response ?? {};
    } catch (error) {
      console.error('Error fetching mined coins:', error);
      throw error;
    }
  }

  async getArchivedStorage(): Promise<string> {
    try {
      const response = await this.http.get<string>(`${this.backendUrl}/explorer/archivedStorage`).toPromise();
      return response ?? '0';
    } catch (error) {
      console.error('Error fetching archived storage:', error);
      return '0';
    }
  }

  async getTotalAmountOfContracts(): Promise<string> {
    try {
      const response = await this.http.get<string>(`${this.backendUrl}/explorer/totalAmountOfContracts`).toPromise();
      return response ?? '0';
    } catch (error) {
      console.error('Error fetching total amount of contracts:', error);
      return '0';
    }
  }

  async getTotalAmountOfCoins(): Promise<string> {
    try {
      const response = await this.http.get<string>(`${this.backendUrl}/explorer/totalAmountOfCoins`).toPromise();
      return response ?? '0';
    } catch (error) {
      console.error('Error fetching total amount of coins:', error);
      return '0';
    }
  }
}

interface HashMap<K, V> {
  [key: string]: string;
}