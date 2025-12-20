import { UTCDate } from '@date-fns/utc';
import { createClient } from '@supabase/supabase-js';
import { subMonths } from 'date-fns';

import { releases, releasesTracking } from '@/db/schema';
import { Tables } from './database-factory';
import {
  DatabaseInterface,
  RuntimeData,
  RuntimePaginationResult,
  TrackingMetrics,
} from './database-interface';

export class SupabaseDatabase implements DatabaseInterface {
  private readonly supabase;
  private readonly runtimePaginationLimit = 20;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getLatestReleaseRecordForRuntimeVersion(
    runtimeVersion: string,
  ): Promise<typeof releases.$inferSelect | null> {
    const { data, error } = await this.supabase
      .from(Tables.RELEASES)
      .select()
      .eq('runtime_version', runtimeVersion)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return {
        id: data.id,
        runtimeVersion: data.runtime_version,
        path: data.path,
        timestamp: data.timestamp,
        commitHash: data.commit_hash,
        commitMessage: data.commit_message,
        updateId: data.update_id,
      };
    }

    return null;
  }

  async getReleaseByPath(path: string): Promise<typeof releases.$inferSelect | null> {
    const { data, error } = await this.supabase
      .from(Tables.RELEASES)
      .select()
      .eq('path', path)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return {
        id: data.id,
        runtimeVersion: data.runtime_version,
        path: data.path,
        timestamp: data.timestamp,
        commitHash: data.commit_hash,
        commitMessage: data.commit_message,
        updateId: data.update_id,
      };
    }

    return null;
  }

  async getReleaseTrackingMetricsForAllReleases(): Promise<TrackingMetrics[]> {
    const { count: iosCount, error: iosError } = await this.supabase
      .from(Tables.RELEASES_TRACKING)
      .select('platform', { count: 'estimated', head: true })
      .eq('platform', 'ios');

    const { count: androidCount, error: androidError } = await this.supabase
      .from(Tables.RELEASES_TRACKING)
      .select('platform', { count: 'estimated', head: true })
      .eq('platform', 'android');

    if (iosError || androidError) {
      throw new Error(iosError?.message || androidError?.message);
    }
    return [
      {
        platform: 'ios',
        count: Number(iosCount),
      },
      {
        platform: 'android',
        count: Number(androidCount),
      },
    ];
  }

  async getReleaseTrackingsLastMonth(): Promise<(typeof releasesTracking.$inferSelect)[]> {
    const oneMonthAgo = subMonths(new UTCDate(), 1);

    const { data, error } = await this.supabase
      .from(Tables.RELEASES_TRACKING)
      .select()
      .order('download_timestamp', { ascending: false })
      .gte('download_timestamp', oneMonthAgo.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getReleaseTrackingMetricsLastMonth(): Promise<Map<string, TrackingMetrics[]>> {
    const oneMonthAgo = subMonths(new UTCDate(), 1);

    const { data, error } = await this.supabase
      .from(Tables.RELEASES_TRACKING)
      .select('platform, download_timestamp')
      .gte('download_timestamp', oneMonthAgo.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    const metricsMap = new Map<string, TrackingMetrics[]>();

    data.forEach((record) => {
      const dateKey = record.download_timestamp.split('T')[0];
      const platform = record.platform;

      if (!metricsMap.has(dateKey)) {
        metricsMap.set(dateKey, []);
      }

      const platformMetrics = metricsMap.get(dateKey)!;
      const existingMetric = platformMetrics.find((m) => m.platform === platform);

      if (existingMetric) {
        existingMetric.count += 1;
      } else {
        platformMetrics.push({ platform, count: 1 });
      }
    });

    return metricsMap;
  }

  async createTracking(
    tracking: typeof releasesTracking.$inferInsert,
  ): Promise<typeof releasesTracking.$inferSelect> {
    const { data, error } = await this.supabase
      .from(Tables.RELEASES_TRACKING)
      .insert({
        release_id: tracking.releaseId,
        platform: tracking.platform,
        download_timestamp: tracking.downloadTimestamp,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
  async getReleaseTrackingMetrics(releaseId: string): Promise<TrackingMetrics[]> {
    const { count: iosCount, error: iosError } = await this.supabase
      .from(Tables.RELEASES_TRACKING)
      .select('platform', { count: 'estimated', head: true })
      .eq('release_id', releaseId)
      .eq('platform', 'ios');

    const { count: androidCount, error: androidError } = await this.supabase
      .from(Tables.RELEASES_TRACKING)
      .select('platform', { count: 'estimated', head: true })
      .eq('release_id', releaseId)
      .eq('platform', 'android');

    if (iosError || androidError) {
      throw new Error(iosError?.message || androidError?.message);
    }

    return [
      {
        platform: 'ios',
        count: Number(iosCount),
      },
      {
        platform: 'android',
        count: Number(androidCount),
      },
    ];
  }

  async createRelease(
    release: typeof releases.$inferInsert,
  ): Promise<typeof releases.$inferSelect> {
    const { data, error } = await this.supabase
      .from(Tables.RELEASES)
      .insert({
        path: release.path,
        runtime_version: release.runtimeVersion,
        timestamp: release.timestamp,
        commit_hash: release.commitHash,
        commit_message: release.commitMessage,
        update_id: release.updateId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  async getRelease(id: string): Promise<typeof releases.$inferSelect | null> {
    const { data, error } = await this.supabase
      .from(Tables.RELEASES)
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return {
        id: data.id,
        path: data.path,
        runtimeVersion: data.runtime_version,
        timestamp: data.timestamp,
        commitHash: data.commit_hash,
        commitMessage: data.commit_message,
        updateId: data.update_id,
      };
    }

    return null;
  }

  async listReleases(): Promise<(typeof releases.$inferSelect)[]> {
    const { data, error } = await this.supabase
      .from(Tables.RELEASES)
      .select()
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }
    return data.map((release) => ({
      id: release.id,
      path: release.path,
      runtimeVersion: release.runtime_version,
      timestamp: release.timestamp,
      size: release.size,
      commitHash: release.commit_hash,
      commitMessage: release.commit_message,
      updateId: release.update_id,
    }));
  }

  async totalReleasesCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from(Tables.RELEASES)
      .select('*', { count: 'estimated', head: true });

    if (error) {
      throw error;
    }

    return count || 0;
  }

  async totalRuntimesCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from(Tables.RELEASES)
      .select('runtime_version', { count: 'estimated', head: true });

    if (error) {
      throw error;
    }

    return count || 0;
  }

  async listRuntimes(nextCursor: string): Promise<RuntimePaginationResult> {
    const limit = nextCursor === '' ? this.runtimePaginationLimit + 3 : this.runtimePaginationLimit;

    let query = this.supabase
      .from(Tables.RELEASES)
      .select('runtime_version, timestamp', { count: 'estimated' })
      .order('runtime_version', { ascending: false })
      .limit(limit + 1);

    if (nextCursor) {
      query = query.lt('runtime_version', nextCursor);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        data: [],
        nextCursor: null,
        hasNextCursor: false,
      };
    }

    const hasNextCursor = data.length > limit;
    if (hasNextCursor) {
      data.pop();
    }

    const runtimesMap = new Map<string, { lastReleasedAt: string; totalReleases: number }>();

    data.forEach((record) => {
      const existing = runtimesMap.get(record.runtime_version);
      const recordTimestamp = record.timestamp;

      if (existing) {
        existing.totalReleases += 1;
        if (new Date(recordTimestamp) > new Date(existing.lastReleasedAt)) {
          existing.lastReleasedAt = recordTimestamp;
        }
      } else {
        runtimesMap.set(record.runtime_version, {
          lastReleasedAt: recordTimestamp,
          totalReleases: 1,
        });
      }
    });

    const runtimesData: RuntimeData[] = Array.from(runtimesMap.entries()).map(
      ([runtimeVersion, info]) => ({
        runtimeVersion,
        lastReleasedAt: info.lastReleasedAt,
        totalReleases: info.totalReleases,
      }),
    );

    const newNextCursor = hasNextCursor
      ? runtimesData[runtimesData.length - 1].runtimeVersion
      : null;

    return {
      data: runtimesData,
      nextCursor: newNextCursor,
      hasNextCursor,
    };
  }
}
