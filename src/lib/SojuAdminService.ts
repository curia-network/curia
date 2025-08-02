import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

// Type definitions for admin operations
interface CreateUserParams {
  ircUsername: string;
  ircPassword: string;
  nickname: string;
  realname: string;
}

interface CreateNetworkParams {
  ircUsername: string;
  nickname: string;
}

interface SojuAdminResponse {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * SojuAdminService - Abstraction for Soju IRC bouncer admin operations
 * 
 * Supports dual environments:
 * - Local Development: Unix socket + sojuctl CLI commands
 * - Railway Production: TCP network admin interface
 * 
 * Environment detection is automatic based on NODE_ENV and Railway variables.
 */
export class SojuAdminService {
  private readonly SOCKET_PATH = '/var/lib/soju/admin.sock';
  private readonly TCP_TIMEOUT = 10000; // 10 seconds
  private readonly DEFAULT_NETWORK_HOST = 'ergo';
  private readonly DEFAULT_NETWORK_PORT = '6667';

  /**
   * Determine if we're running in local development environment
   */
  private isLocalEnvironment(): boolean {
    // Check multiple indicators for local development
    const isLocalNode = process.env.NODE_ENV === 'development';
    const isNotRailway = !process.env.RAILWAY_ENVIRONMENT_ID;
    const isSocketForced = process.env.SOJU_ADMIN_METHOD === 'socket';
    
    // Local if any of these conditions are true
    return isLocalNode || isNotRailway || isSocketForced;
  }

  /**
   * Create a new IRC user via admin interface
   */
  async createUser(params: CreateUserParams): Promise<SojuAdminResponse> {
    console.log('[SojuAdmin] Creating IRC user:', {
      ircUsername: params.ircUsername,
      nickname: params.nickname,
      environment: this.isLocalEnvironment() ? 'local' : 'railway',
      timestamp: new Date().toISOString()
    });

    try {
      if (this.isLocalEnvironment()) {
        return await this.createUserViaSojuctl(params);
      } else {
        return await this.createUserViaTcp(params);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SojuAdmin] Failed to create user:', {
        ircUsername: params.ircUsername,
        error: errorMessage,
        environment: this.isLocalEnvironment() ? 'local' : 'railway'
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Create a network connection for an IRC user
   */
  async createNetwork(params: CreateNetworkParams): Promise<SojuAdminResponse> {
    console.log('[SojuAdmin] Creating IRC network for user:', {
      ircUsername: params.ircUsername,
      environment: this.isLocalEnvironment() ? 'local' : 'railway',
      timestamp: new Date().toISOString()
    });

    try {
      if (this.isLocalEnvironment()) {
        return await this.createNetworkViaSojuctl(params);
      } else {
        return await this.createNetworkViaTcp(params);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SojuAdmin] Failed to create network:', {
        ircUsername: params.ircUsername,
        error: errorMessage,
        environment: this.isLocalEnvironment() ? 'local' : 'railway'
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Update an existing user's password
   */
  async updateUserPassword(ircUsername: string, ircPassword: string): Promise<SojuAdminResponse> {
    console.log('[SojuAdmin] Updating password for user:', {
      ircUsername,
      environment: this.isLocalEnvironment() ? 'local' : 'railway',
      timestamp: new Date().toISOString()
    });

    try {
      if (this.isLocalEnvironment()) {
        return await this.updatePasswordViaSojuctl(ircUsername, ircPassword);
      } else {
        return await this.updatePasswordViaTcp(ircUsername, ircPassword);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SojuAdmin] Failed to update password:', {
        ircUsername,
        error: errorMessage,
        environment: this.isLocalEnvironment() ? 'local' : 'railway'
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Provision user (create new or update existing)
   */
  async provisionUser(params: CreateUserParams): Promise<SojuAdminResponse> {
    console.log('[SojuAdmin] Provisioning IRC user:', {
      ircUsername: params.ircUsername,
      nickname: params.nickname,
      environment: this.isLocalEnvironment() ? 'local' : 'railway',
      timestamp: new Date().toISOString()
    });

    try {
      // Try to create user first
      const userResult = await this.createUser(params);
      
      if (!userResult.success) {
        // Check if it failed because user already exists
        if (userResult.error && userResult.error.includes('already exists')) {
          console.log('[SojuAdmin] User exists, updating password:', params.ircUsername);
          
          // Update password instead
          const passwordResult = await this.updateUserPassword(params.ircUsername, params.ircPassword);
          if (!passwordResult.success) {
            throw new Error(`Failed to update password: ${passwordResult.error}`);
          }
          
          return {
            success: true,
            output: `Updated existing user ${params.ircUsername}`
          };
        } else {
          // Real error - rethrow
          throw new Error(userResult.error || 'Unknown user creation error');
        }
      }

      // User was created successfully, now create network
      const networkResult = await this.createNetwork({
        ircUsername: params.ircUsername,
        nickname: params.nickname
      });

      if (!networkResult.success) {
        console.warn('[SojuAdmin] User created but network creation failed:', {
          ircUsername: params.ircUsername,
          networkError: networkResult.error
        });
        // Don't fail the whole operation for network creation
      }

      return {
        success: true,
        output: `Created new user ${params.ircUsername} with network`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SojuAdmin] Failed to provision user:', {
        ircUsername: params.ircUsername,
        error: errorMessage,
        environment: this.isLocalEnvironment() ? 'local' : 'railway'
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Test admin interface connectivity
   */
  async testConnection(): Promise<SojuAdminResponse> {
    console.log('[SojuAdmin] Testing admin interface connection...');
    
    try {
      if (this.isLocalEnvironment()) {
        const { stdout } = await execAsync('docker exec curia-irc-soju sojuctl -config /etc/soju/soju.conf user status');
        return {
          success: true,
          output: `Unix socket connection OK. Users: ${stdout.trim()}`
        };
      } else {
        const response = await this.sendTcpAdminCommand('user list');
        return {
          success: true,
          output: `TCP connection OK. Response: ${response}`
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Connection test failed: ${errorMessage}`
      };
    }
  }

  // ===== PRIVATE METHODS - Unix Socket Implementation =====

  /**
   * Create user via sojuctl CLI (local development)
   */
  private async createUserViaSojuctl(params: CreateUserParams): Promise<SojuAdminResponse> {
    const { ircUsername, ircPassword, nickname, realname } = params;
    
    // Escape shell arguments to prevent injection
    const escapedUsername = this.escapeShellArg(ircUsername);
    const escapedPassword = this.escapeShellArg(ircPassword);
    const escapedNickname = this.escapeShellArg(nickname);
    const escapedRealname = this.escapeShellArg(realname);
    
    const cmd = `docker exec curia-irc-soju sojuctl -config /etc/soju/soju.conf user create -username ${escapedUsername} -password ${escapedPassword} -nick ${escapedNickname} -realname ${escapedRealname}`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd);
      
      // Check if user already exists (not an error for our use case)
      if (stderr && stderr.includes('already exists')) {
        console.log('[SojuAdmin] User already exists, proceeding:', { ircUsername });
        return {
          success: true,
          output: `User ${ircUsername} already exists`
        };
      }
      
      // Check for other errors
      if (stderr && !stderr.includes('already exists')) {
        throw new Error(`sojuctl stderr: ${stderr}`);
      }
      
      console.log('[SojuAdmin] User created via sojuctl:', { 
        ircUsername, 
        stdout: stdout.trim() 
      });
      
      return {
        success: true,
        output: stdout.trim()
      };
      
    } catch (error) {
      throw new Error(`sojuctl user create failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Update user password via sojuctl CLI (local development)
   */
  private async updatePasswordViaSojuctl(ircUsername: string, ircPassword: string): Promise<SojuAdminResponse> {
    const escapedUsername = this.escapeShellArg(ircUsername);
    const escapedPassword = this.escapeShellArg(ircPassword);
    
    const cmd = `docker exec curia-irc-soju sojuctl -config /etc/soju/soju.conf user update ${escapedUsername} -password ${escapedPassword}`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd);
      
      if (stderr) {
        throw new Error(`sojuctl stderr: ${stderr}`);
      }
      
      console.log('[SojuAdmin] Password updated via sojuctl:', { 
        ircUsername, 
        stdout: stdout.trim() 
      });
      
      return {
        success: true,
        output: stdout.trim()
      };
      
    } catch (error) {
      throw new Error(`sojuctl user update failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Create network via sojuctl CLI (local development)
   */
  private async createNetworkViaSojuctl(params: CreateNetworkParams): Promise<SojuAdminResponse> {
    const { ircUsername, nickname } = params;
    
    const escapedUsername = this.escapeShellArg(ircUsername);
    const escapedNickname = this.escapeShellArg(nickname);
    const networkAddr = `irc+insecure://${this.DEFAULT_NETWORK_HOST}:${this.DEFAULT_NETWORK_PORT}`;
    
    const cmd = `docker exec curia-irc-soju sojuctl -config /etc/soju/soju.conf user run ${escapedUsername} network create -addr "${networkAddr}" -name commonground -username ${escapedUsername} -nick ${escapedNickname}`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd);
      
      // Check if network already exists
      if (stderr && stderr.includes('already exists')) {
        console.log('[SojuAdmin] Network already exists, proceeding:', { ircUsername });
        return {
          success: true,
          output: `Network for ${ircUsername} already exists`
        };
      }
      
      if (stderr && !stderr.includes('already exists')) {
        throw new Error(`sojuctl stderr: ${stderr}`);
      }
      
      console.log('[SojuAdmin] Network created via sojuctl:', { 
        ircUsername, 
        stdout: stdout.trim() 
      });
      
      return {
        success: true,
        output: stdout.trim()
      };
      
    } catch (error) {
      throw new Error(`sojuctl network create failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // ===== PRIVATE METHODS - TCP Implementation =====

  /**
   * Create user via TCP admin interface (Railway production)
   */
  private async createUserViaTcp(params: CreateUserParams): Promise<SojuAdminResponse> {
    const { ircUsername, ircPassword, nickname, realname } = params;
    const command = `user create -username "${ircUsername}" -password "${ircPassword}" -nick "${nickname}" -realname "${realname}"`;
    
    const response = await this.sendTcpAdminCommand(command);
    
    return {
      success: true,
      output: response
    };
  }

  /**
   * Update user password via TCP admin interface (Railway production)
   */
  private async updatePasswordViaTcp(ircUsername: string, ircPassword: string): Promise<SojuAdminResponse> {
    const command = `user update "${ircUsername}" -password "${ircPassword}"`;
    const response = await this.sendTcpAdminCommand(command);
    
    return {
      success: true,
      output: response
    };
  }

  /**
   * Create network via TCP admin interface (Railway production)
   */
  private async createNetworkViaTcp(params: CreateNetworkParams): Promise<SojuAdminResponse> {
    const { ircUsername, nickname } = params;
    const networkAddr = `irc+insecure://${this.DEFAULT_NETWORK_HOST}:${this.DEFAULT_NETWORK_PORT}`;
    const command = `user run "${ircUsername}" network create -addr "${networkAddr}" -name commonground -username "${ircUsername}" -nick "${nickname}"`;
    
    const response = await this.sendTcpAdminCommand(command);
    
    return {
      success: true,
      output: response
    };
  }

  /**
   * Send command to Soju via TCP admin interface
   */
  private async sendTcpAdminCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const adminPassword = process.env.SOJU_ADMIN_PASSWORD;
      if (!adminPassword) {
        reject(new Error('SOJU_ADMIN_PASSWORD environment variable not configured'));
        return;
      }

      const sojuHost = process.env.SOJU_ADMIN_HOST || 'curia-irc-bouncer';
      const sojuPort = parseInt(process.env.SOJU_ADMIN_PORT || '9999');

      console.log('[SojuAdmin] Connecting to TCP admin interface:', {
        host: sojuHost,
        port: sojuPort,
        command: command.substring(0, 50) + '...' // Log truncated command
      });

      const client = net.createConnection(sojuPort, sojuHost);
      let responseData = '';

      client.on('connect', () => {
        console.log('[SojuAdmin] TCP connection established');
        // Send admin authentication and command
        client.write(`PASS ${adminPassword}\r\n`);
        client.write(`${command}\r\n`);
        client.write('QUIT\r\n'); // Clean disconnect
      });

      client.on('data', (data) => {
        responseData += data.toString();
      });

      client.on('end', () => {
        client.destroy();
        
        // Parse response for errors
        if (responseData.includes('ERROR') || responseData.includes('FAIL')) {
          reject(new Error(`Soju admin command failed: ${responseData.trim()}`));
        } else {
          console.log('[SojuAdmin] TCP command successful:', {
            response: responseData.trim().substring(0, 100) + '...'
          });
          resolve(responseData.trim());
        }
      });

      client.on('error', (error) => {
        reject(new Error(`TCP connection error: ${error.message}`));
      });

      // Set timeout
      client.setTimeout(this.TCP_TIMEOUT, () => {
        client.destroy();
        reject(new Error(`TCP admin command timeout after ${this.TCP_TIMEOUT}ms`));
      });
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Escape shell arguments to prevent injection attacks
   */
  private escapeShellArg(arg: string): string {
    // Replace single quotes with '\'' and wrap in single quotes
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

  /**
   * Get configuration summary for debugging
   */
  getConfig() {
    return {
      environment: this.isLocalEnvironment() ? 'local' : 'railway',
      method: this.isLocalEnvironment() ? 'unix-socket' : 'tcp',
      socketPath: this.SOCKET_PATH,
      tcpHost: process.env.SOJU_ADMIN_HOST || 'curia-irc-bouncer',
      tcpPort: process.env.SOJU_ADMIN_PORT || '9999',
      hasAdminPassword: !!process.env.SOJU_ADMIN_PASSWORD,
      nodeEnv: process.env.NODE_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT_ID,
      adminMethod: process.env.SOJU_ADMIN_METHOD
    };
  }
}

// Export singleton instance
export const sojuAdminService = new SojuAdminService();