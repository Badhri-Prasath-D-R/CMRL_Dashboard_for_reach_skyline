from fastapi import APIRouter, Depends
from app.database import db
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/efficiency", tags=["Efficiency"])

@router.get("/teams")
async def team_efficiency(current_user = Depends(get_current_user)):
    # Aggregate tasks by team
    pipeline = [
        {
            "$group": {
                "_id": "$team",
                "totalTasks": {"$sum": 1},
                "completedTasks": {
                    "$sum": {
                        "$cond": [
                            {"$or": [{"$eq": ["$status", "Completed"]}, {"$eq": ["$status", "Call Completed"]}]},
                            1,
                            0
                        ]
                    }
                },
                # For minutes-based efficiency, we need to sum minutes for completed vs total
                "totalMinutes": {
                    "$sum": {
                        "$sum": {
                            "$map": {
                                "input": {"$objectToArray": "$minutes"},
                                "as": "item",
                                "in": "$$item.v"
                            }
                        }
                    }
                },
                "completedMinutes": {
                    "$sum": {
                        "$cond": [
                            {"$or": [{"$eq": ["$status", "Completed"]}, {"$eq": ["$status", "Call Completed"]}]},
                            {"$sum": {
                                "$map": {
                                    "input": {"$objectToArray": "$minutes"},
                                    "as": "item",
                                    "in": "$$item.v"
                                }
                            }},
                            0
                        ]
                    }
                }
            }
        }
    ]
    cursor = db.db["tasks"].aggregate(pipeline)
    results = await cursor.to_list(length=None)
    # Format output
    efficiency_data = []
    for row in results:
        team = row["_id"]
        total_tasks = row["totalTasks"]
        completed_tasks = row["completedTasks"]
        total_minutes = row["totalMinutes"]
        completed_minutes = row["completedMinutes"]
        if total_minutes > 0:
            efficiency = round((completed_minutes / total_minutes) * 100)
        else:
            # fallback to task count
            efficiency = round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
        efficiency_data.append({
            "department": team.capitalize() + " Team",
            "total": total_tasks,
            "completed": completed_tasks,
            "efficiency": efficiency
        })
    return efficiency_data