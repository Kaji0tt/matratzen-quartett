import type { Card } from '@/types'

export const DEMO_CARDS: Card[] = [
  {
    id: '1', name: 'Berliner Bürgersteig-Bett', description: 'Ein klassischer Fund aus Prenzlauer Berg.',
    rarity: 'common', image_url: '', location: 'Schönhauser Allee', city: 'Berlin', country: 'DE',
    stats: { witterung: 60, flecken: 70, ambiente: 35, komfort: 65, charakter: 30 },
    photographer_id: '1', photographer_username: 'berlinlens', created_at: '2024-01-15T10:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '2', name: 'Hamburger Hafenmatratze', description: 'Direkt am Hafen mit Seeluft imprägniert.',
    rarity: 'common', image_url: '', location: 'Hafenstraße', city: 'Hamburg', country: 'DE',
    stats: { witterung: 90, flecken: 75, ambiente: 65, komfort: 20, charakter: 45 },
    photographer_id: '2', photographer_username: 'hamburgfoto', created_at: '2024-02-01T14:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '3', name: 'Münchner Oktoberfest-Rest', description: 'Nach dem Fest übrig geblieben. Legendary.',
    rarity: 'legendary', image_url: '', location: 'Theresienwiese', city: 'München', country: 'DE',
    stats: { witterung: 80, flecken: 85, ambiente: 30, komfort: 10, charakter: 95 },
    photographer_id: '3', photographer_username: 'muenchenclick', created_at: '2024-03-10T08:00:00Z',
    is_approved: true, report_count: 0, edition_number: 1, total_editions: 10, attributes: [],
  },
  {
    id: '4', name: 'Kölner Dom-Nähe-Matratze', description: 'Mit Aussicht auf den Dom.',
    rarity: 'rare', image_url: '', location: 'Domstraße', city: 'Köln', country: 'DE',
    stats: { witterung: 15, flecken: 15, ambiente: 95, komfort: 80, charakter: 20 },
    photographer_id: '4', photographer_username: 'koelnfotograf', created_at: '2024-04-05T12:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '5', name: 'Frankfurter Banken-Viertel-Fund', description: 'High-Society-Matratze.',
    rarity: 'epic', image_url: '', location: 'Bankenviertel', city: 'Frankfurt', country: 'DE',
    stats: { witterung: 5, flecken: 5, ambiente: 35, komfort: 95, charakter: 30 },
    photographer_id: '5', photographer_username: 'frankfurtsnap', created_at: '2024-05-20T16:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
  {
    id: '6', name: 'Stuttgarter Weinberg-Lager', description: 'Zwischen Reben gefunden.',
    rarity: 'common', image_url: '', location: 'Rotenberg', city: 'Stuttgart', country: 'DE',
    stats: { witterung: 50, flecken: 45, ambiente: 80, komfort: 55, charakter: 65 },
    photographer_id: '6', photographer_username: 'stuttgartpix', created_at: '2024-06-12T09:00:00Z',
    is_approved: true, report_count: 0, attributes: [],
  },
]
