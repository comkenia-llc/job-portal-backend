# Job Automation

Rules implemented:

- freshness <= 3 days (sourcePostedAt or crawlerFetchedAt)
- max 100/day (configurable)
- strict dedupe
- queue for editor/admin review when valid
- shell-company creation when a valid employer job has a company name but no matching company
- market-aware validation for configured source market

## Run manually

```bash
npm run automation:jobs -- --user-id=1 --max-per-day=100 --dry-run=true
```

Optional file input:

```bash
npm run automation:jobs -- --file=src/data/jobAutomationInput.sample.json --user-id=1 --dry-run=true
```

## Admin APIs

- `POST /api/admin/job-automation/run`
- `GET /api/admin/job-automation/report`
- `GET /api/admin/job-automation/queue`
- `POST /api/admin/job-automation/queue/:id/resolve`
- `POST /api/admin/job-automation/queue/:id/reject`

## Source config

Default file: `src/data/jobAutomationSources.json`

Supported adapters:

- `greenhouse`
- `ashby`
- `lever`
- `html-scrape`
- `generic-json`

## Zero-config company discovery

If you do not configure any enabled sources, automation can fall back to crawling company websites already stored in your database.

It will:

- read active companies for the target market that have a `website`
- probe common careers paths like `/careers`, `/jobs`, `/vacancies`
- try to discover job detail pages automatically
- extract title, description, location, and publishable raw jobs

Optional envs:

- `JOB_AUTOMATION_AUTO_DISCOVERY=true`
- `JOB_AUTOMATION_AUTO_DISCOVERY_COMPANY_LIMIT=50`
- `JOB_AUTOMATION_AUTO_DISCOVERY_MAX_JOBS_PER_COMPANY=10`
- `JOB_AUTOMATION_TARGET_MARKET=pk`

Example source entries:

```json
[
  {
    "id": "pk-employer-greenhouse",
    "name": "Employer Careers",
    "sourceType": "company",
    "country": "PK",
    "market": "pk",
    "currency": "PKR",
    "adapter": "greenhouse",
    "boardToken": "employer-board-token",
    "enabled": true
  },
  {
    "id": "pk-employer-ashby",
    "name": "Employer Careers",
    "sourceType": "company",
    "country": "PK",
    "market": "pk",
    "currency": "PKR",
    "adapter": "ashby",
    "boardName": "employer-board-name",
    "enabled": true
  },
  {
    "id": "pk-employer-lever",
    "name": "Employer Careers",
    "sourceType": "company",
    "country": "PK",
    "market": "pk",
    "currency": "PKR",
    "adapter": "lever",
    "site": "employer-site",
    "enabled": true
  },
  {
    "id": "pk-employer-html",
    "name": "Employer Careers",
    "sourceType": "company",
    "country": "PK",
    "market": "pk",
    "currency": "PKR",
    "adapter": "html-scrape",
    "url": "https://employer.com/careers",
    "companyName": "Employer",
    "listItemSelector": ".job-card",
    "titleSelector": ".job-title",
    "linkSelector": "a.job-link",
    "locationSelector": ".job-location",
    "detailDescriptionSelector": ".job-description",
    "defaultJobType": "full-time",
    "enabled": true
  }
]
```

You can override via env:

- `JOB_AUTOMATION_SOURCES_FILE`
- `JOB_AUTOMATION_SOURCES_JSON`
- `JOB_AUTOMATION_SOURCE_ALLOWLIST`
