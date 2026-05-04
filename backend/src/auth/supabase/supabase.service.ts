import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor(private readonly config: AppConfigService) {
    this.supabaseUrl = this.config.supabaseUrl;
    this.supabaseKey = this.config.supabaseServiceRoleKey;
    this.logger.log('Supabase service initialized');
  }

  private createAdminClient() {
    return createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async signUp(email: string, password: string) {
    const client = this.createAdminClient();
    return client.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });
  }

  async signInWithPassword(email: string, password: string) {
    const client = this.createAdminClient();
    return client.auth.signInWithPassword({ email, password });
  }

  async resetPasswordForEmail(email: string, redirectTo: string) {
    const client = this.createAdminClient();
    return client.auth.resetPasswordForEmail(email, { redirectTo });
  }

  async deleteUser(userId: string) {
    const client = this.createAdminClient();
    return client.auth.admin.deleteUser(userId);
  }

  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string,
  ) {
    const client = this.createAdminClient();
    return client.storage.from(bucket).upload(path, file, { contentType });
  }

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const client = this.createAdminClient();
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
