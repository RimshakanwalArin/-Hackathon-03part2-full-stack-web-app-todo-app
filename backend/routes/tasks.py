"""
Task API routes
Maps to @specs/api/rest-endpoints.md
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import Optional, List
from datetime import datetime

from db import get_session
from models import Task, User
from schemas import (
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskResponse,
    TaskListResponse,
    TaskCreateResponse,
    TaskUpdateResponse,
    TaskDeleteResponse,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# Mock user_id for development (in production, extract from JWT token)
MOCK_USER_ID = "test-user-123"


@router.post("", response_model=TaskCreateResponse)
async def create_task(
    task_data: TaskCreateRequest,
    session: Session = Depends(get_session),
) -> TaskCreateResponse:
    """
    Create a new task
    Maps to create_task MCP tool
    """
    print(f"[DEBUG] tasks:create_task >> POST /api/tasks endpoint called | title={task_data.title}")
    try:
        # Create new task
        print(f"[DEBUG] tasks:create_task >> Creating new task object | title={task_data.title} | description_length={len(task_data.description) if task_data.description else 0} | user_id={MOCK_USER_ID}")
        new_task = Task(
            title=task_data.title,
            description=task_data.description,
            completed=False,
            user_id=MOCK_USER_ID,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        print("[DEBUG] tasks:create_task >> Adding task to database session")
        session.add(new_task)
        print("[DEBUG] tasks:create_task >> Committing task to database")
        session.commit()
        print("[DEBUG] tasks:create_task >> Refreshing task from database")
        session.refresh(new_task)
        print(f"[DEBUG] tasks:create_task >> Task created successfully | task_id={new_task.id} | title={new_task.title}")

        print(f"[DEBUG] tasks:create_task >> Returning TaskCreateResponse | task_id={new_task.id}")
        return TaskCreateResponse(
            task_id=new_task.id,
            status="created",
            title=new_task.title,
        )

    except Exception as e:
        print(f"[ERROR] tasks:create_task >> {type(e).__name__}: {str(e)}")
        session.rollback()
        print("[DEBUG] tasks:create_task >> Session rolled back due to error")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create task: {str(e)}",
        )


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by status: all, pending, completed"),
    sort: Optional[str] = Query(None, description="Sort by: created, title, completed"),
    session: Session = Depends(get_session),
) -> TaskListResponse:
    """
    List tasks for current user
    Maps to list_tasks MCP tool
    """
    print(f"[DEBUG] tasks:list_tasks >> GET /api/tasks endpoint called | status={status} | sort={sort}")
    try:
        # Build query
        print(f"[DEBUG] tasks:list_tasks >> Building database query | user_id={MOCK_USER_ID}")
        query = select(Task).where(Task.user_id == MOCK_USER_ID)

        # Apply status filter
        if status == "pending":
            print("[DEBUG] tasks:list_tasks >> Applying status filter | filter=pending (completed=false)")
            query = query.where(Task.completed == False)
        elif status == "completed":
            print("[DEBUG] tasks:list_tasks >> Applying status filter | filter=completed (completed=true)")
            query = query.where(Task.completed == True)
        else:
            print("[DEBUG] tasks:list_tasks >> No status filter applied")

        # Execute query
        print("[DEBUG] tasks:list_tasks >> Executing database query")
        tasks = session.exec(query).all()
        print(f"[DEBUG] tasks:list_tasks >> Query executed | task_count={len(tasks)}")

        # Apply sorting
        if sort == "title":
            print("[DEBUG] tasks:list_tasks >> Sorting tasks by title")
            tasks = sorted(tasks, key=lambda t: t.title)
        elif sort == "completed":
            print("[DEBUG] tasks:list_tasks >> Sorting tasks by completed status")
            tasks = sorted(tasks, key=lambda t: (t.completed, -tasks.index(t)))
        else:  # Default: created (newest first)
            print("[DEBUG] tasks:list_tasks >> Sorting tasks by created_at (newest first)")
            tasks = sorted(tasks, key=lambda t: t.created_at, reverse=True)

        # Convert to response models
        print("[DEBUG] tasks:list_tasks >> Converting tasks to response models")
        task_responses = [
            TaskResponse(
                id=t.id,
                user_id=t.user_id,
                title=t.title,
                description=t.description,
                completed=t.completed,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in tasks
        ]

        print(f"[DEBUG] tasks:list_tasks >> Returning TaskListResponse | total={len(task_responses)} | status_filter={status} | sort_order={sort}")
        return TaskListResponse(
            tasks=task_responses,
            total=len(task_responses),
            status_filter=status,
            sort_order=sort,
        )

    except Exception as e:
        print(f"[ERROR] tasks:list_tasks >> {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch tasks: {str(e)}",
        )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    session: Session = Depends(get_session),
) -> TaskResponse:
    """
    Get a single task by ID
    """
    print(f"[DEBUG] tasks:get_task >> GET /api/tasks/{task_id} endpoint called")
    try:
        print(f"[DEBUG] tasks:get_task >> Querying database for task | task_id={task_id} | user_id={MOCK_USER_ID}")
        task = session.exec(
            select(Task).where(Task.id == task_id).where(Task.user_id == MOCK_USER_ID)
        ).first()

        if not task:
            print(f"[DEBUG] tasks:get_task >> Task not found | task_id={task_id}")
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        print(f"[DEBUG] tasks:get_task >> Task found | task_id={task_id} | title={task.title}")
        print(f"[DEBUG] tasks:get_task >> Returning TaskResponse | task_id={task_id}")
        return TaskResponse(
            id=task.id,
            user_id=task.user_id,
            title=task.title,
            description=task.description,
            completed=task.completed,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )

    except HTTPException:
        print("[DEBUG] tasks:get_task >> HTTPException raised, re-raising")
        raise
    except Exception as e:
        print(f"[ERROR] tasks:get_task >> {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch task: {str(e)}",
        )


@router.patch("/{task_id}", response_model=TaskUpdateResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdateRequest,
    session: Session = Depends(get_session),
) -> TaskUpdateResponse:
    """
    Update a task
    """
    print(f"[DEBUG] tasks:update_task >> PATCH /api/tasks/{task_id} endpoint called")
    try:
        print(f"[DEBUG] tasks:update_task >> Querying database for task | task_id={task_id} | user_id={MOCK_USER_ID}")
        task = session.exec(
            select(Task).where(Task.id == task_id).where(Task.user_id == MOCK_USER_ID)
        ).first()

        if not task:
            print(f"[DEBUG] tasks:update_task >> Task not found | task_id={task_id}")
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        print(f"[DEBUG] tasks:update_task >> Task found | task_id={task_id} | current_title={task.title}")
        # Update fields
        if task_data.title is not None:
            print(f"[DEBUG] tasks:update_task >> Updating title | old={task.title} | new={task_data.title}")
            task.title = task_data.title
        if task_data.description is not None:
            print(f"[DEBUG] tasks:update_task >> Updating description | new_length={len(task_data.description)}")
            task.description = task_data.description
        if task_data.completed is not None:
            print(f"[DEBUG] tasks:update_task >> Updating completed | old={task.completed} | new={task_data.completed}")
            task.completed = task_data.completed

        task.updated_at = datetime.utcnow()

        print("[DEBUG] tasks:update_task >> Adding task to session")
        session.add(task)
        print("[DEBUG] tasks:update_task >> Committing changes to database")
        session.commit()
        print("[DEBUG] tasks:update_task >> Refreshing task from database")
        session.refresh(task)

        print(f"[DEBUG] tasks:update_task >> Task updated successfully | task_id={task.id} | title={task.title} | completed={task.completed}")
        print(f"[DEBUG] tasks:update_task >> Returning TaskUpdateResponse | task_id={task.id}")
        return TaskUpdateResponse(
            task_id=task.id,
            status="updated",
            title=task.title,
            completed=task.completed,
        )

    except HTTPException:
        print("[DEBUG] tasks:update_task >> HTTPException raised, re-raising")
        raise
    except Exception as e:
        print(f"[ERROR] tasks:update_task >> {type(e).__name__}: {str(e)}")
        session.rollback()
        print("[DEBUG] tasks:update_task >> Session rolled back due to error")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update task: {str(e)}",
        )


@router.delete("/{task_id}", response_model=TaskDeleteResponse)
async def delete_task(
    task_id: int,
    session: Session = Depends(get_session),
) -> TaskDeleteResponse:
    """
    Delete a task
    """
    print(f"[DEBUG] tasks:delete_task >> DELETE /api/tasks/{task_id} endpoint called")
    try:
        print(f"[DEBUG] tasks:delete_task >> Querying database for task | task_id={task_id} | user_id={MOCK_USER_ID}")
        task = session.exec(
            select(Task).where(Task.id == task_id).where(Task.user_id == MOCK_USER_ID)
        ).first()

        if not task:
            print(f"[DEBUG] tasks:delete_task >> Task not found | task_id={task_id}")
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        print(f"[DEBUG] tasks:delete_task >> Task found | task_id={task_id} | title={task.title}")
        title = task.title
        print("[DEBUG] tasks:delete_task >> Deleting task from database")
        session.delete(task)
        print("[DEBUG] tasks:delete_task >> Committing deletion to database")
        session.commit()
        print(f"[DEBUG] tasks:delete_task >> Task deleted successfully | task_id={task_id} | title={title}")

        print(f"[DEBUG] tasks:delete_task >> Returning TaskDeleteResponse | task_id={task_id}")
        return TaskDeleteResponse(
            task_id=task_id,
            status="deleted",
            title=title,
        )

    except HTTPException:
        print("[DEBUG] tasks:delete_task >> HTTPException raised, re-raising")
        raise
    except Exception as e:
        print(f"[ERROR] tasks:delete_task >> {type(e).__name__}: {str(e)}")
        session.rollback()
        print("[DEBUG] tasks:delete_task >> Session rolled back due to error")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete task: {str(e)}",
        )
