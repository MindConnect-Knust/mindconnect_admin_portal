import { http } from './http';
import { listContent, listTrustedSources } from './contentApi';

export async function getInstitutionalSummary() {
  const response = await http.get('/institutional/manage/summary');
  return response.data || {};
}

export async function getInstitutionalSourceHealth() {
  const response = await http.get('/institutional/manage/source-health');
  return response.data || [];
}

export async function getInstitutionalProgrammes() {
  const response = await http.get('/institutional/manage/programmes');
  return response.data || [];
}

export async function getAcademicCalendars() {
  const response = await http.get('/institutional/manage/calendars');
  return response.data || [];
}

export async function getInstitutionalCounsellors() {
  const response = await http.get('/institutional/counsellors');
  return response.data || [];
}

export async function getInstitutionalSupportServices() {
  const response = await http.get('/institutional/support-services');
  return response.data || [];
}

export async function getInstitutionalWorkspace() {
  const [summary, sourceResult, sourceHealth, review, published, events, programmes, calendars, counsellors, services] =
    await Promise.all([
      getInstitutionalSummary(),
      listTrustedSources(),
      getInstitutionalSourceHealth(),
      listContent({ status: 'review', limit: 100 }),
      listContent({ status: 'published', limit: 100 }),
      listContent({ type: 'EVENT', limit: 100 }),
      getInstitutionalProgrammes(),
      getAcademicCalendars(),
      getInstitutionalCounsellors(),
      getInstitutionalSupportServices(),
    ]);
  return {
    summary,
    sources: (sourceResult.sources || []).filter((source) =>
      source.institutionalSourceType || source.isOfficialKNUST || source.isOfficialInstitution
    ),
    sourceHealth,
    review: review.items || [],
    published: published.items || [],
    events: events.items || [],
    programmes,
    calendars,
    counsellors,
    services,
  };
}