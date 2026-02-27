/**
 * Layout Configuration - Auto-generated from DNA Repository
 * DO NOT EDIT MANUALLY - This file is managed by the DNA Orchestrator
 *
 * Last updated: 2026-01-27T01:05:21.387Z
 */

export interface LayoutComponent {
  id: string;
  type: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, any>;
}

export interface PageLayout {
  pageName: string;
  components: LayoutComponent[];
  lastUpdated: string;
}

export const LAYOUTS: Record<string, PageLayout> = {
  "test-page": {
    "pageName": "Test Page",
    "components": [
      {
        "id": "summary-pending-1703847621-1769475447858",
        "type": "summary-card",
        "title": "Test Summary Card",
        "icon": "📊",
        "w": 1,
        "h": 1,
        "x": 0,
        "y": 0,
        "props": {
          "label": "Test Pending",
          "value": "5",
          "color": "yellow"
        }
      },
      {
        "id": "summary-approved-1703847622-1769475447858",
        "type": "summary-card",
        "title": "Test Summary Card",
        "icon": "📊",
        "w": 1,
        "h": 1,
        "x": 1,
        "y": 0,
        "props": {
          "label": "Test Approved",
          "value": "12",
          "color": "green"
        }
      },
      {
        "id": "summary-rejected-1703847623-1769475447858",
        "type": "summary-card",
        "title": "Test Summary Card",
        "icon": "📊",
        "w": 1,
        "h": 1,
        "x": 2,
        "y": 0,
        "props": {
          "label": "Test Rejected",
          "value": "3",
          "color": "red"
        }
      },
      {
        "id": "table-1703847624-1769475447858",
        "type": "data-table",
        "title": "Data Table",
        "icon": "📋",
        "w": 3,
        "h": 2,
        "x": 0,
        "y": 1,
        "props": {
          "title": "Data Table",
          "columns": [
            "ID",
            "Name",
            "Status",
            "Date"
          ],
          "pageSize": 10
        }
      }
    ],
    "lastUpdated": "2026-01-27T01:04:58.849Z"
  }
};

export function getLayout(pageName: string): PageLayout | undefined {
  const key = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return LAYOUTS[key];
}

export function getAllLayouts(): PageLayout[] {
  return Object.values(LAYOUTS);
}
