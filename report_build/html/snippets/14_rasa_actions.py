# chatbot/actions.py — Rasa custom actions for the Shifty assistant
from typing import Any, Dict, List, Text
import requests
from rasa_sdk import Action, Tracker
from rasa_sdk.events import SlotSet
from rasa_sdk.executor import CollectingDispatcher

API_BASE = 'http://localhost:4000/api'


class ActionQuoteEstimate(Action):
    """Returns a rough price estimate for a 3-tier package quote."""

    def name(self) -> Text:
        return 'action_quote_estimate'

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        distance = tracker.get_slot('distance_km')
        items    = tracker.get_slot('item_count')
        fragile  = tracker.get_slot('fragile_count') or 0

        if not distance or not items:
            dispatcher.utter_message(
                text='I need the distance and item count to quote. '
                     'Could you share your pickup and destination?'
            )
            return []

        try:
            resp = requests.post(f'{API_BASE}/pricing/quote', json={
                'distance_km': float(distance),
                'total_items': int(items),
                'fragile_count': int(fragile)
            }, timeout=5)
            q = resp.json()
        except requests.RequestException:
            dispatcher.utter_message(text='Pricing service is unreachable, please retry.')
            return []

        dispatcher.utter_message(
            text=(f"Here are your estimates:\n"
                  f"- Basic    : Rs.{q['basic']}\n"
                  f"- Standard : Rs.{q['standard']}\n"
                  f"- Premium  : Rs.{q['premium']}\n"
                  f"Recommended: {q['recommended']}")
        )
        return [SlotSet('last_quote', q)]


class ActionBookingStatus(Action):
    """Looks up status of the user's most recent booking."""

    def name(self) -> Text:
        return 'action_booking_status'

    def run(self, dispatcher, tracker, domain):
        token = tracker.get_slot('auth_token')
        if not token:
            dispatcher.utter_message(text='Please log in so I can look up your booking.')
            return []

        resp = requests.get(f'{API_BASE}/bookings/latest',
                            headers={'Authorization': f'Bearer {token}'})
        if resp.status_code != 200:
            dispatcher.utter_message(text='No active booking found.')
            return []

        b = resp.json()
        dispatcher.utter_message(
            text=(f"Booking #{b['_id'][-6:]} is currently *{b['status']}*.\n"
                  f"Mover: {b.get('mover_name','To be assigned')}  "
                  f"Move date: {b['move_date'][:10]}")
        )
        return []


class ActionCancelBooking(Action):
    def name(self): return 'action_cancel_booking'

    def run(self, dispatcher, tracker, domain):
        token      = tracker.get_slot('auth_token')
        booking_id = tracker.get_slot('booking_id')
        if not (token and booking_id):
            dispatcher.utter_message(text='Which booking should I cancel?')
            return []

        resp = requests.patch(
            f'{API_BASE}/bookings/{booking_id}/cancel',
            headers={'Authorization': f'Bearer {token}'}
        )
        if resp.ok:
            dispatcher.utter_message(text='Your booking has been cancelled.')
        else:
            dispatcher.utter_message(text=resp.json().get('message', 'Could not cancel.'))
        return []
