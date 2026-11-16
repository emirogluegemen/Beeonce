# v0.1 REST API contract

API base: `http://127.0.0.1:3001/api`. Client uses `/api` through the Vite proxy. All requests and responses are JSON. Routes marked **protected** require `Authorization: Bearer <JWT>`; the role is loaded from the database. There is no account registration in v0.1; seed creates the fictional accounts.

| Method | Route | Allowed actor | Request / response |
|---|---|---|---|
| GET | `/health` | Anyone | `{status:"ok",release:"v0.1"}` |
| POST | `/auth/login` | Anyone | `{email,password}` → `{token,user}` |
| GET | `/auth/me` | Any logged-in user | `{user}` |
| GET | `/children` | Parent, specialist | `{children:[{id,displayName}]}`; only own/linked |
| GET | `/child/me` | Child | `{child:{id,displayName}}` |
| GET | `/children/:childId/specialists` | Owning parent | `{specialists:[...]}` |
| POST | `/children/:childId/specialists` | Owning parent | `{email,specialistType}` → `201` |
| DELETE | `/children/:childId/specialists/:userId` | Owning parent | `204`; revokes access immediately |
| GET | `/children/:childId/events?weekStart=YYYY-MM-DD` | Parent, linked specialist, child-self | `{events:[...]}` |
| POST | `/children/:childId/events` | Parent, linked specialist | `{title,description?,startsAt,endsAt}` → `201 {event}` |
| GET | `/children/:childId/tasks?weekStart=YYYY-MM-DD&assignedBy=me` | Parent, linked specialist, child-self | `{tasks:[...]}`; `assignedBy` only parent/specialist |
| POST | `/children/:childId/tasks` | Parent, linked specialist | `{title,description,developmentArea,dueAt}` → `201 {task}` |
| PATCH | `/tasks/:taskId/completion` | Child who owns task | `{completed:true}` → `{task:{id,status,completedAt}}` |

### Status codes

`200` successful read/update; `201` created; `204` deleted; `400` invalid request; `401` unauthenticated/invalid credentials; `403` unauthorized role, unlinked account, different child/family; `404` absent child/task/specialist/email (where applicable); `409` existing specialist link; `413` JSON body over 64 KB; `500` unexpected server failure.

### Validation and security rules

- `specialistType`: `teacher`, `psychologist`, `doctor`, `special_education_teacher`, `coach`. Must be a **registered** specialist account.
- `developmentArea`: `cognitive`, `social_emotional`, `language`, `motor`, `self_care`.
- Dates: `dueAt` and `weekStart` are `YYYY-MM-DD` dates; `weekStart` must be a Monday in UTC. `startsAt` and `endsAt` are ISO-8601 instants with an explicit offset or `Z`. Events must end after they start.
- `weekStart` filters events that overlap `[Monday 00:00 UTC, following Monday 00:00 UTC)` and tasks by due date in `[Monday, following Monday)`.
- Parent access is granted only if `children.parent_user_id` matches the logged-in user. Specialist access requires an **existing live** `specialist_links` row for the child on *every* request. Children read only their own tasks and schedule; they cannot create tasks or events.
- The server never trusts a `role` field from the login form or JWT claims. The JWT contains only a signed user ID; database account role is checked for every request.

### Sample requests

```sh
curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"parent@demo.test","password":"Demo1234!"}'
```

Copy the returned `token` into `TOKEN` in your shell, then:

```sh
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/children
curl -H "Authorization: Bearer $TOKEN" \
 -H 'Content-Type: application/json' \
 -d '{"email":"doctor@demo.test","specialistType":"doctor"}' \
 http://127.0.0.1:3001/api/children/1/specialists
```
