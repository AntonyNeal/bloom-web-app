Find available appointments
get
https://au-api.halaxy.com/main/Appointment/$find

The $find operation generates a list of available appointments from the Slot Resources. It will use the Online booking preferences to ensure that the available times adhere to buffer time, lead time and advance booking limit.

ℹ️
Context
In Halaxy, Online Booking Preferences are set individually per practitioner at each location. To find or learn more about these settings, see: Manage online booking preferences

Query Params
start
string
required
Appointment start

end
string
required
Appointment end

practitioner-role
string
Appointment practitioner-role

practitioner
string
Appointment practitioner

organization
string
Appointment organization

duration
string
required
Appointment duration

show
string
enum
Appointment show


Allowed:

first-available
emergency
boolean
Ignores lead time to show all available times for emergency appointments


apply-buffer-time
boolean
Applies buffer time to show all available times


_sort
string
enum
Each item in the comma-separated list is a search parameter, optionally with a ' - ' prefix. The prefix indicates decreasing order; in its absence, the parameter is applied in increasing order.


Allowed:

start

-start
Responses

200
Appointment resource

403
Forbidden

404
Resource not found

Updated about 2 months ago

Update Appointment
Schedule
Did this page help you?
Language

Shell

Node

Ruby

PHP

Python
Credentials
OAuth2
Bearer
token

URL

https://au-api.halaxy.com
/main/Appointment/$find
1
curl --request GET \
2
     --url 'https://au-api.halaxy.com/main/Appointment/$find' \
3
     --header 'accept: application/fhir+json'

Try It!
Response
1
{
2
  "identifier": {
3
    "use": "usual",
4
    "type": {
5
      "coding": [
6
        {
7
          "system": "string",
8
          "code": "string",
9
          "display": "string",
10
          "userSelected": true,
11
          "id": "string"
12
        }
13
      ],
14
      "text": "string",
15
      "id": "string"
16
    },
17
    "system": "string",
18
    "value": "string",
19
    "period": {
20
      "start": "2025-12-04T21:22:31.327Z",
21
      "end": "2025-12-04T21:22:31.327Z",
22
      "id": "string"
23
    },
24
    "assigner": {
25
      "reference": "string",
26
      "type": "Organization",
27
      "id": "string"
28
    },
29
    "id": "string"
30
  },
31
  "type": "document",
32
  "timestamp": "2025-12-04T21:22:31.327Z",
33
  "total": 0,
34
  "link": [
35
    {
36
      "relation": "string",
37
      "url": "string",
38
      "id": "string"
39
    }
40
  ],
41
  "entry": [
42
    {
43
      "fullUrl": "string",
44
      "resource": {
45
        "id": "string",
46
        "meta": {
47
          "lastUpdated": "2025-12-04T21:22:31.327Z",
48
          "profile": "string"
49
        },
50
        "resourceType": "string"
51
      },
52
      "search": {
53
        "mode": "match",
54
        "score": 0,
55
        "id": "string"
56
      },
57
      "id": "string"
58
    }
59
  ],
60
  "id": "string",
61
  "meta": {
62
    "lastUpdated": "2025-12-04T21:22:31.327Z",
63
    "profile": "string"
64
  },
65
  "resourceType": "string"
66
}

