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
  const results = await Promise.allSettled([
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

  const val = (idx, fallback) => (results[idx].status === 'fulfilled' ? results[idx].value : fallback);

  const summary = val(0, {});
  const sourceResult = val(1, { sources: [] });
  const sourceHealth = val(2, []);
  const review = val(3, { items: [] });
  const published = val(4, { items: [] });
  const events = val(5, { items: [] });
  const programmes = val(6, []);
  const calendars = val(7, []);
  const counsellors = val(8, []);
  const services = val(9, []);

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