// lib/ipRotator.ts
import axios from 'axios';

class IPRotator {
  private ipPool: string[];
  private currentIndex: number;

  constructor() {
    // Placeholder IP addresses (replace with real proxy IPs)
    this.ipPool = Array.from({ length: 100 }, (_, i) => `192.168.1.${i + 1}:8080`);
    this.currentIndex = 0;
  }

  // Get the next IP address in the pool
  private getNextIP(): string {
    const ip = this.ipPool[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.ipPool.length;
    return ip;
  }

  // Make an HTTP request with the rotated IP
  async makeRequest(url: string, proxyAuth?: { username: string; password: string }): Promise<any> {
    const proxyIP = this.getNextIP();
    const proxyConfig = {
      host: proxyIP.split(':')[0],
      port: parseInt(proxyIP.split(':')[1]),
      auth: proxyAuth ? { username: proxyAuth.username, password: proxyAuth.password } : undefined,
    };

    try {
      const response = await axios.get(url, {
        proxy: proxyConfig,
        headers: {
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`,
        },
      });
      console.log(`Request to ${url} succeeded with IP: ${proxyIP}`);
      return response.data;
    } catch (error: any) {
      console.error(`Request failed with IP: ${proxyIP}, Error: ${error.message}`);
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  // Get the current IP pool size
  getPoolSize(): number {
    return this.ipPool.length;
  }

  // Add a new IP to the pool
  addIP(ip: string): void {
    if (!this.ipPool.includes(ip)) {
      this.ipPool.push(ip);
      console.log(`Added IP: ${ip}`);
    }
  }

  // Remove an IP from the pool
  removeIP(ip: string): void {
    const index = this.ipPool.indexOf(ip);
    if (index !== -1) {
      this.ipPool.splice(index, 1);
      console.log(`Removed IP: ${ip}`);
    }
  }
}

export default IPRotator;

// Example usage
async function example() {
  const rotator = new IPRotator();

  // Example proxy authentication (replace with real credentials)
  const proxyAuth = {
    username: 'your-username',
    password: 'your-password',
  };

  try {
    for (let i = 0; i < 5; i++) {
      const data = await rotator.makeRequest('https://api.ipify.org?format=json', proxyAuth);
      console.log(`Response ${i + 1}:`, data);
    }
    console.log(`IP Pool Size: ${rotator.getPoolSize()}`);
  } catch (error) {
    console.error('Example failed:', error);
  }
}