import { BetaAnalyticsDataClient, protos } from '@google-analytics/data';
import * as gaxFallback from 'google-gax/fallback';

type RunReportRequest =
  protos.google.analytics.data.v1beta.IRunReportRequest;
type RunReportResponse =
  protos.google.analytics.data.v1beta.IRunReportResponse;
type ReportRow = protos.google.analytics.data.v1beta.IRow;
type FilterExpression = protos.google.analytics.data.v1beta.IFilterExpression;

const CACHE_TTL_MS = 5 * 60 * 1000;
const propertyId = process.env.GA_PROPERTY_ID;

let analyticsCache: { data: AnalyticsData; expiresAt: number } | null = null;
let pendingAnalyticsRequest: Promise<AnalyticsData> | null = null;

export interface AnalyticsData {
  generatedAt: string;
  range: {
    label: string;
    startDate: string;
    endDate: string;
  };
  cacheTtlSeconds: number;
  summary: {
    sessionsToday: number;
    sessions30Days: number;
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    pageViews: number;
    avgSessionDuration: number;
    engagementRate: number;
    productViews: number;
    productClicks: number;
    whatsappLeads: number;
    searchEvents: number;
    filterEvents: number;
  };
  topPages: Array<{ path: string; title: string; views: number }>;
  productPerformance: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
  topSearches: Array<{ term: string; count: number }>;
  daily: Array<{ date: string; sessions: number; users: number }>;
  demographics: {
    ageGroups: Array<{ range: string; count: number }>;
    genders: Array<{ gender: string; count: number }>;
  };
  locations: {
    countries: Array<{ country: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  };
  devices: Array<{ category: string; count: number; percentage: number }>;
  trafficSources: Array<{
    channel: string;
    source: string;
    medium: string;
    count: number;
  }>;
  events: Array<{ name: string; label: string; count: number }>;
  visits24h: number;
  visitsMonth: number;
  uniqueUsers: number;
  avgSessionDuration: number;
}

function getAnalyticsClient() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJson) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set',
    );
  }

  const credentials = JSON.parse(credentialsJson);

  return new BetaAnalyticsDataClient(
    {
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key?.replace(/\\n/g, '\n'),
      },
      fallback: true,
      projectId: credentials.project_id,
    },
    gaxFallback,
  );
}

function getPropertyName() {
  if (!propertyId) {
    throw new Error('GA_PROPERTY_ID environment variable is not set');
  }

  return propertyId.startsWith('properties/')
    ? propertyId
    : `properties/${propertyId}`;
}

function getMetric(row: ReportRow | undefined, index: number): number {
  const value = row?.metricValues?.[index]?.value;
  const parsedValue = Number(value ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getDimension(
  row: ReportRow | undefined,
  index: number,
  fallback = 'Unknown',
): string {
  const value = row?.dimensionValues?.[index]?.value?.trim();

  if (!value || value === '(not set)' || value === '(not provided)') {
    return fallback;
  }

  return value;
}

function getRows(report: RunReportResponse): ReportRow[] {
  return report.rows ?? [];
}

function exactDimension(fieldName: string, value: string): FilterExpression {
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: 'EXACT' as const,
        value,
        caseSensitive: false,
      },
    },
  };
}

function notExactDimension(fieldName: string, value: string): FilterExpression {
  return {
    notExpression: exactDimension(fieldName, value),
  };
}

function notPathPrefix(prefix: string): FilterExpression {
  return {
    notExpression: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: {
          matchType: 'BEGINS_WITH' as const,
          value: prefix,
          caseSensitive: false,
        },
      },
    },
  };
}

function publicPagesFilter(): FilterExpression {
  return {
    andGroup: {
      expressions: [notPathPrefix('/admin'), notPathPrefix('/login')],
    },
  };
}

async function runReport(
  client: BetaAnalyticsDataClient,
  request: Omit<RunReportRequest, 'property'>,
): Promise<RunReportResponse> {
  const [report] = await client.runReport({
    property: getPropertyName(),
    ...request,
  });

  return report;
}

function getGaErrorMessage(error: unknown): string {
  const maybeError = error as {
    code?: unknown;
    details?: unknown;
    message?: unknown;
  };
  const details =
    typeof maybeError?.details === 'string' ? maybeError.details.trim() : '';
  const message =
    typeof maybeError?.message === 'string' ? maybeError.message.trim() : '';
  const code =
    typeof maybeError?.code === 'number' || typeof maybeError?.code === 'string'
      ? `GA4 ${maybeError.code}: `
      : '';
  const usefulMessage = details || message;

  if (!usefulMessage || usefulMessage === 'undefined undefined: undefined') {
    return 'GA4 no devolvio un detalle util del error. Revisa credenciales, acceso a la propiedad y Analytics Data API.';
  }

  return `${code}${usefulMessage}`;
}

async function runOptionalReport(
  client: BetaAnalyticsDataClient,
  label: string,
  request: Omit<RunReportRequest, 'property'>,
): Promise<RunReportResponse> {
  try {
    return await runReport(client, request);
  } catch (error) {
    console.warn(
      `Optional GA4 report failed (${label}): ${getGaErrorMessage(error)}`,
    );
    return { rows: [] };
  }
}

function aggregateDimensionCounts(
  report: RunReportResponse,
  dimensionIndex: number,
  fallback: string,
) {
  const values = new Map<string, number>();

  getRows(report).forEach((row) => {
    const dimension = getDimension(row, dimensionIndex, fallback);
    const count = getMetric(row, 0);

    values.set(dimension, (values.get(dimension) ?? 0) + count);
  });

  return Array.from(values.entries()).map(([label, count]) => ({
    label,
    count,
  }));
}

function parseEventCounts(report: RunReportResponse) {
  const eventCounts = new Map<string, number>();

  getRows(report).forEach((row) => {
    const eventName = getDimension(row, 0, 'unknown');
    eventCounts.set(eventName, getMetric(row, 0));
  });

  return eventCounts;
}

async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const client = getAnalyticsClient();
  const thirtyDayRange = { startDate: '30daysAgo', endDate: 'today' };

  const [
    summaryReport,
    todayReport,
    eventsReport,
    topPagesReport,
    productPerformanceReport,
    topSearchesReport,
    dailyReport,
    demographicsReport,
    locationsReport,
    devicesReport,
    trafficReport,
  ] = await Promise.all([
    runReport(client, {
      dateRanges: [thirtyDayRange],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' },
        { name: 'itemViewEvents' },
        { name: 'itemsClickedInList' },
      ],
    }),
    runReport(client, {
      dateRanges: [{ startDate: 'today', endDate: 'today' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
    }),
    runOptionalReport(client, 'events', {
      dateRanges: [thirtyDayRange],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [
              'view_item',
              'select_item',
              'view_item_list',
              'view_search_results',
              'filter_products',
              'generate_lead',
            ],
          },
        },
      },
    }),
    runOptionalReport(client, 'top pages', {
      dateRanges: [thirtyDayRange],
      dimensions: [
        { name: 'pagePathPlusQueryString' },
        { name: 'pageTitle' },
      ],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: publicPagesFilter(),
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    runOptionalReport(client, 'product performance', {
      dateRanges: [thirtyDayRange],
      dimensions: [
        { name: 'itemId' },
        { name: 'itemName' },
        { name: 'itemBrand' },
        { name: 'itemCategory' },
      ],
      metrics: [{ name: 'itemsViewed' }, { name: 'itemsClickedInList' }],
      dimensionFilter: notExactDimension('itemName', '(not set)'),
      orderBys: [
        { metric: { metricName: 'itemsViewed' }, desc: true },
        { metric: { metricName: 'itemsClickedInList' }, desc: true },
      ],
      limit: 25,
    }),
    runOptionalReport(client, 'top searches', {
      dateRanges: [thirtyDayRange],
      dimensions: [{ name: 'searchTerm' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            exactDimension('eventName', 'view_search_results'),
            notExactDimension('searchTerm', '(not set)'),
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10,
    }),
    runOptionalReport(client, 'daily sessions', {
      dateRanges: [{ startDate: '13daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      dimensionFilter: publicPagesFilter(),
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    runOptionalReport(client, 'demographics', {
      dateRanges: [thirtyDayRange],
      dimensions: [{ name: 'userAgeBracket' }, { name: 'userGender' }],
      metrics: [{ name: 'totalUsers' }],
    }),
    runOptionalReport(client, 'locations', {
      dateRanges: [thirtyDayRange],
      dimensions: [{ name: 'country' }, { name: 'city' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 15,
    }),
    runOptionalReport(client, 'devices', {
      dateRanges: [thirtyDayRange],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    }),
    runOptionalReport(client, 'traffic sources', {
      dateRanges: [thirtyDayRange],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),
  ]);

  const summaryRow = getRows(summaryReport)[0];
  const todayRow = getRows(todayReport)[0];
  const eventCounts = parseEventCounts(eventsReport);
  const productViews = Math.max(
    getMetric(summaryRow, 7),
    eventCounts.get('view_item') ?? 0,
  );
  const productClicks = Math.max(
    getMetric(summaryRow, 8),
    eventCounts.get('select_item') ?? 0,
  );

  const topPages = getRows(topPagesReport).map((row) => ({
    path: getDimension(row, 0, '/'),
    title: getDimension(row, 1, 'Sin titulo'),
    views: getMetric(row, 0),
  }));

  const productPerformanceMap = new Map<
    string,
    AnalyticsData['productPerformance'][number]
  >();

  getRows(productPerformanceReport).forEach((row) => {
    const views = getMetric(row, 0);
    const clicks = getMetric(row, 1);

    if (views <= 0 && clicks <= 0) return;

    const id = getDimension(row, 0, 'unknown');
    const name = getDimension(row, 1, 'Producto sin nombre');
    const brand = getDimension(row, 2, 'Sin marca');
    const category = getDimension(row, 3, 'Sin tipo');
    const key = `${id}-${name}`;
    const existingProduct = productPerformanceMap.get(key);

    if (existingProduct) {
      existingProduct.views += views;
      existingProduct.clicks += clicks;

      if (existingProduct.brand === 'Sin marca' && brand !== 'Sin marca') {
        existingProduct.brand = brand;
      }

      if (
        existingProduct.category === 'Sin tipo' &&
        category !== 'Sin tipo'
      ) {
        existingProduct.category = category;
      }

      existingProduct.ctr =
        existingProduct.views > 0
          ? existingProduct.clicks / existingProduct.views
          : 0;
      return;
    }

    productPerformanceMap.set(key, {
      id,
      name,
      brand,
      category,
      views,
      clicks,
      ctr: views > 0 ? clicks / views : 0,
    });
  });

  const productPerformance = Array.from(productPerformanceMap.values())
    .sort((a, b) => b.views - a.views || b.clicks - a.clicks)
    .slice(0, 10);

  const topSearches = getRows(topSearchesReport)
    .map((row) => ({
      term: getDimension(row, 0, ''),
      count: getMetric(row, 0),
    }))
    .filter((search) => search.term);

  const daily = getRows(dailyReport).map((row) => ({
    date: getDimension(row, 0, ''),
    sessions: getMetric(row, 0),
    users: getMetric(row, 1),
  }));

  const ageOrder = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const ageGroups = aggregateDimensionCounts(demographicsReport, 0, 'unknown')
    .map(({ label, count }) => ({ range: label, count }))
    .sort((a, b) => {
      const aIndex = ageOrder.indexOf(a.range);
      const bIndex = ageOrder.indexOf(b.range);

      if (aIndex === -1 && bIndex === -1) return b.count - a.count;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });

  const genders = aggregateDimensionCounts(demographicsReport, 1, 'unknown')
    .map(({ label, count }) => ({ gender: label, count }))
    .sort((a, b) => b.count - a.count);

  const countryMap = new Map<string, number>();
  const cityMap = new Map<string, number>();

  getRows(locationsReport).forEach((row) => {
    const country = getDimension(row, 0, 'Unknown');
    const city = getDimension(row, 1, '');
    const count = getMetric(row, 0);

    countryMap.set(country, (countryMap.get(country) ?? 0) + count);
    if (city) {
      cityMap.set(city, (cityMap.get(city) ?? 0) + count);
    }
  });

  const devicesWithoutPercent = getRows(devicesReport).map((row) => ({
    category: getDimension(row, 0, 'unknown'),
    count: getMetric(row, 0),
  }));
  const deviceTotal = devicesWithoutPercent.reduce(
    (sum, device) => sum + device.count,
    0,
  );
  const devices = devicesWithoutPercent.map((device) => ({
    ...device,
    percentage: deviceTotal > 0 ? device.count / deviceTotal : 0,
  }));

  const trafficSources = getRows(trafficReport).map((row) => ({
    channel: getDimension(row, 0, 'Unassigned'),
    source: getDimension(row, 1, '(direct)'),
    medium: getDimension(row, 2, '(none)'),
    count: getMetric(row, 0),
  }));

  const summary = {
    sessionsToday: getMetric(todayRow, 0),
    sessions30Days: getMetric(summaryRow, 0),
    totalUsers: getMetric(summaryRow, 1),
    activeUsers: getMetric(summaryRow, 2),
    newUsers: getMetric(summaryRow, 3),
    pageViews: getMetric(summaryRow, 4),
    avgSessionDuration: getMetric(summaryRow, 5),
    engagementRate: getMetric(summaryRow, 6),
    productViews,
    productClicks,
    whatsappLeads: eventCounts.get('generate_lead') ?? 0,
    searchEvents: eventCounts.get('view_search_results') ?? 0,
    filterEvents: eventCounts.get('filter_products') ?? 0,
  };

  const events = [
    {
      name: 'view_item',
      label: 'Vistas de producto',
      count: summary.productViews,
    },
    {
      name: 'select_item',
      label: 'Clics en productos',
      count: summary.productClicks,
    },
    {
      name: 'generate_lead',
      label: 'Clics en WhatsApp',
      count: summary.whatsappLeads,
    },
    {
      name: 'view_search_results',
      label: 'Busquedas',
      count: summary.searchEvents,
    },
    {
      name: 'filter_products',
      label: 'Filtros aplicados',
      count: summary.filterEvents,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    range: {
      label: 'Ultimos 30 dias',
      startDate: '30daysAgo',
      endDate: 'today',
    },
    cacheTtlSeconds: CACHE_TTL_MS / 1000,
    summary,
    topPages,
    productPerformance,
    topSearches,
    daily,
    demographics: {
      ageGroups,
      genders,
    },
    locations: {
      countries: Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      cities: Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    },
    devices,
    trafficSources,
    events,
    visits24h: summary.sessionsToday,
    visitsMonth: summary.sessions30Days,
    uniqueUsers: summary.totalUsers,
    avgSessionDuration: summary.avgSessionDuration,
  };
}

export async function getAnalyticsData(
  options: { forceRefresh?: boolean } = {},
): Promise<AnalyticsData> {
  const now = Date.now();

  if (
    !options.forceRefresh &&
    analyticsCache &&
    analyticsCache.expiresAt > now
  ) {
    return analyticsCache.data;
  }

  if (!options.forceRefresh && pendingAnalyticsRequest) {
    return pendingAnalyticsRequest;
  }

  pendingAnalyticsRequest = fetchAnalyticsData()
    .then((data) => {
      analyticsCache = {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      return data;
    })
    .finally(() => {
      pendingAnalyticsRequest = null;
    });

  return pendingAnalyticsRequest;
}
