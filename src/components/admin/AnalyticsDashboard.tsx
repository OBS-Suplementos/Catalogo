'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AnalyticsData } from '@/lib/analytics/ga-client';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

type StatColor = 'primary' | 'accent' | 'green' | 'blue' | 'purple' | 'amber';

interface StatCardProps {
  title: string;
  value: string | number;
  detail?: string;
  icon: ReactNode;
  color?: StatColor;
}

async function requestAnalytics(forceRefresh = false): Promise<AnalyticsData> {
  const url = forceRefresh ? '/api/analytics?refresh=true' : '/api/analytics';
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(errorData?.error || 'No se pudo cargar analytics');
  }

  return res.json();
}

function StatCard({
  title,
  value,
  detail,
  icon,
  color = 'primary',
}: StatCardProps) {
  const colorClasses: Record<StatColor, string> = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <div className={`rounded-md p-3 ${colorClasses[color]}`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {detail && (
              <p className="truncate text-xs text-muted-foreground">
                {detail}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR').format(Math.round(value));
}

function formatPercent(value: number): string {
  const percent = Number.isFinite(value) ? value * 100 : 0;
  return `${percent.toFixed(1)}%`;
}

function formatDuration(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);

  return `${mins}m ${secs}s`;
}

function formatGaDate(date: string): string {
  if (!/^\d{8}$/.test(date)) return date;

  const parsedDate = new Date(
    `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00`,
  );

  return parsedDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

function formatGeneratedAt(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    male: 'Masculino',
    female: 'Femenino',
    unknown: 'Sin datos',
  };

  return labels[gender.toLowerCase()] || gender;
}

function getDeviceLabel(category: string): string {
  const labels: Record<string, string> = {
    desktop: 'Escritorio',
    mobile: 'Móvil',
    tablet: 'Tablet',
    unknown: 'Sin datos',
  };

  return labels[category.toLowerCase()] || category;
}

export default function AnalyticsDashboard({
  totalProducts,
}: {
  totalProducts: number;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const analyticsData = await requestAnalytics();
        if (isMounted) {
          setData(analyticsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Error loading analytics',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const analyticsData = await requestAnalytics(true);
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading analytics');
    } finally {
      setRefreshing(false);
    }
  };

  const derivedMetrics = useMemo(() => {
    if (!data) {
      return {
        productCtr: 0,
        leadRate: 0,
        maxProductViews: 1,
        maxDailySessions: 1,
      };
    }

    return {
      productCtr:
        data.summary.productViews > 0
          ? data.summary.productClicks / data.summary.productViews
          : 0,
      leadRate:
        data.summary.productViews > 0
          ? data.summary.whatsappLeads / data.summary.productViews
          : 0,
      maxProductViews: Math.max(
        ...data.productPerformance.map((product) => product.views),
        1,
      ),
      maxDailySessions: Math.max(
        ...data.daily.map((day) => day.sessions),
        1,
      ),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data && error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
        <p className="font-medium">Error al cargar analytics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {data.range.label} · Actualizado {formatGeneratedAt(data.generatedAt)}
          </p>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          isLoading={refreshing}
        >
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total productos"
          value={formatNumber(totalProducts)}
          color="primary"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </Icon>
          }
        />
        <StatCard
          title="Sesiones hoy"
          value={formatNumber(data.summary.sessionsToday)}
          color="accent"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </Icon>
          }
        />
        <StatCard
          title="Sesiones 30 días"
          value={formatNumber(data.summary.sessions30Days)}
          color="green"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"
              />
            </Icon>
          }
        />
        <StatCard
          title="Usuarios"
          value={formatNumber(data.summary.totalUsers)}
          detail={`${formatNumber(data.summary.newUsers)} nuevos`}
          color="blue"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-6a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </Icon>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vistas de página"
          value={formatNumber(data.summary.pageViews)}
          color="purple"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </Icon>
          }
        />
        <StatCard
          title="Engagement"
          value={formatPercent(data.summary.engagementRate)}
          detail={formatDuration(data.summary.avgSessionDuration)}
          color="amber"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.264h6.586c.969 0 1.371 1.24.588 1.81l-5.329 3.872 2.036 6.264c.3.921-.755 1.688-1.539 1.118L12 18.382l-5.329 3.873c-.784.57-1.838-.197-1.539-1.118l2.036-6.264-5.329-3.872c-.783-.57-.38-1.81.588-1.81h6.586l2.036-6.264z"
              />
            </Icon>
          }
        />
        <StatCard
          title="Productos vistos"
          value={formatNumber(data.summary.productViews)}
          detail={`${formatPercent(derivedMetrics.productCtr)} CTR`}
          color="primary"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M3 12h18M3 17h18"
              />
            </Icon>
          }
        />
        <StatCard
          title="WhatsApp"
          value={formatNumber(data.summary.whatsappLeads)}
          detail={`${formatPercent(derivedMetrics.leadRate)} sobre vistas`}
          color="green"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
              />
            </Icon>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="order-3">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Productos con más interés
            </h2>
          </CardHeader>
          <CardContent>
            {data.productPerformance.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-[minmax(0,1fr)_156px] items-center gap-4 text-xs text-muted-foreground">
                  <span />
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <span>Vistas</span>
                    <span>Clics</span>
                    <span>CTR</span>
                  </div>
                </div>
                {data.productPerformance.map((product, index) => (
                  <div
                    key={`${product.id}-${product.name}-${product.brand}-${product.category}-${index}`}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {product.brand} · {product.category}
                        </p>
                      </div>
                      <div className="grid min-w-[156px] grid-cols-3 gap-3 text-right text-sm">
                        <span>{formatNumber(product.views)}</span>
                        <span>{formatNumber(product.clicks)}</span>
                        <span>{formatPercent(product.ctr)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${Math.max(
                            4,
                            (product.views / derivedMetrics.maxProductViews) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>
                Aún no hay datos de productos. Los eventos nuevos empiezan a
                aparecer cuando GA4 los procese.
              </EmptyState>
            )}
          </CardContent>
        </Card>

        <Card className="order-1">
          <CardHeader>
            <h2 className="text-lg font-semibold">Sesiones por día</h2>
          </CardHeader>
          <CardContent>
            {data.daily.length > 0 ? (
              <div className="flex h-40 items-end gap-2 overflow-x-auto pb-2">
                {data.daily.map((day) => (
                  <div
                    key={day.date}
                    className="flex min-w-9 flex-col items-center gap-2"
                  >
                    <div className="flex h-28 w-full items-end justify-center">
                      <div
                        className="w-5 rounded-t bg-accent"
                        title={`${formatNumber(day.sessions)} sesiones`}
                        style={{
                          height: `${Math.max(
                            4,
                            (day.sessions / derivedMetrics.maxDailySessions) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatGaDate(day.date)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Sin datos diarios todavía.</EmptyState>
            )}
          </CardContent>
        </Card>

        <Card className="order-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Búsquedas</h2>
          </CardHeader>
          <CardContent>
            {data.topSearches.length > 0 ? (
              <div className="space-y-3">
                {data.topSearches.map((search, index) => (
                  <div
                    key={`${search.term}-${index}`}
                    className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                  >
                    <span className="truncate font-medium">{search.term}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(search.count)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Sin búsquedas registradas.</EmptyState>
            )}
          </CardContent>
        </Card>

        <Card className="order-5">
          <CardHeader>
            <h2 className="text-lg font-semibold">Fuentes de tráfico</h2>
          </CardHeader>
          <CardContent>
            {data.trafficSources.length > 0 ? (
              <div className="space-y-3">
                {data.trafficSources.map((source, index) => (
                  <div
                    key={`${source.channel}-${source.source}-${index}`}
                    className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{source.channel}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {source.source} / {source.medium}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(source.count)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Aún no hay datos de tráfico.</EmptyState>
            )}
          </CardContent>
        </Card>

        <Card className="order-2">
          <CardHeader>
            <h2 className="text-lg font-semibold">Dispositivos</h2>
          </CardHeader>
          <CardContent>
            {data.devices.length > 0 ? (
              <div className="space-y-4">
                {data.devices.map((device) => (
                  <div key={device.category} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="capitalize">
                        {getDeviceLabel(device.category)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatPercent(device.percentage)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${device.percentage * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Sin datos de dispositivos.</EmptyState>
            )}
          </CardContent>
        </Card>

        <Card className="order-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Páginas vistas</h2>
          </CardHeader>
          <CardContent>
            {data.topPages.length > 0 ? (
              <div className="space-y-3">
                {data.topPages.map((page, index) => (
                  <div
                    key={`${page.path}-${index}`}
                    className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{page.path}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {page.title}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(page.views)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Sin datos de páginas.</EmptyState>
            )}
          </CardContent>
        </Card>

        <Card className="order-7">
          <CardHeader>
            <h2 className="text-lg font-semibold">Ubicación</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Países
                </h3>
                {data.locations.countries.length > 0 ? (
                  <div className="space-y-2">
                    {data.locations.countries.map((country) => (
                      <div
                        key={country.country}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="truncate">{country.country}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(country.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                )}
              </div>
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Ciudades
                </h3>
                {data.locations.cities.length > 0 ? (
                  <div className="space-y-2">
                    {data.locations.cities.map((city) => (
                      <div
                        key={city.city}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="truncate">{city.city}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(city.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="order-8">
          <CardHeader>
            <h2 className="text-lg font-semibold">Audiencia</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Género
                </h3>
                {data.demographics.genders.length > 0 ? (
                  <div className="space-y-2">
                    {data.demographics.genders.map((gender) => (
                      <div
                        key={gender.gender}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span>{getGenderLabel(gender.gender)}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(gender.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                )}
              </div>
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Edad
                </h3>
                {data.demographics.ageGroups.length > 0 ? (
                  <div className="space-y-2">
                    {data.demographics.ageGroups.map((age) => (
                      <div
                        key={age.range}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span>{age.range}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(age.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
