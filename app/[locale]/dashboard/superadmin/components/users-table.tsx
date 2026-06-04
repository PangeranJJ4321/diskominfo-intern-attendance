"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  PaginationState,
  SortingState,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
} from "@tanstack/react-table";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { format } from "date-fns";
import { MoreHorizontalIcon, SearchIcon, XIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "INTERN";
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsersTableProps {
  initialPage?: number;
  initialLimit?: number;
}

function ActionsCell({
  row,
  onSuccess,
}: {
  row: Row<User>;
  onSuccess: () => void;
}) {
  const { copyToClipboard } = useCopyToClipboard();

  const handleCopyId = () => {
    copyToClipboard(row.original.id);
    console.log("User ID copied:", row.original.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" size="icon" variant="ghost">
          <MoreHorizontalIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <EditUserDialog
          userId={row.original.id}
          initialName={row.original.name}
          initialEmail={row.original.email}
          onSuccess={onSuccess}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Edit
          </DropdownMenuItem>
        </EditUserDialog>
        <DropdownMenuItem onClick={handleCopyId}>Copy ID</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteUserDialog
          userId={row.original.id}
          userName={row.original.name}
          onSuccess={onSuccess}
        >
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => e.preventDefault()}
          >
            Delete
          </DropdownMenuItem>
        </DeleteUserDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function UsersTable({
  initialPage = 1,
  initialLimit = 10,
}: UsersTableProps) {
  const [data, setData] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: initialPage - 1,
    pageSize: initialLimit,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { q: searchQuery }),
      });

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [pageIndex, pageSize, searchQuery]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "id",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 35,
        enableResizing: false,
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="User"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage
                  src={row.original.image || ""}
                  alt={row.original.name}
                />
                <AvatarFallback>
                  {row.original.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-px">
                <div className="text-foreground font-medium">
                  {row.original.name}
                </div>
                <div className="text-muted-foreground text-sm">
                  {row.original.email}
                </div>
              </div>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: "role",
        id: "role",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Role"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground font-medium">
              {row.original.role}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Joined"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground font-medium">
              {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="w-full flex justify-end">
            <ActionsCell row={row} onSuccess={fetchUsers} />
          </div>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [fetchUsers],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil((data?.length || 0) / pageSize),
    getRowId: (row: User) => row.id,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={data?.length || 0}
      tableLayout={{
        columnsPinnable: true,
        columnsResizable: true,
        columnsMovable: true,
        columnsVisibility: true,
      }}
    >
      <Card className="w-full gap-3 py-0">
        <CardHeader className="flex items-center justify-between px-3.5 py-2">
          <div className="flex items-center justify-between w-full gap-2.5">
            <InputGroup className="w-64">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="w-4 h-4" />
              </InputGroupAddon>

              <InputGroupInput
                className="pl-9"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery.length > 0 && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label="Clear"
                    title="Clear"
                    size="icon-xs"
                    onClick={() => setSearchQuery("")}
                  >
                    <XIcon className="w-4 h-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>
        </CardHeader>
        <CardContent className="border-y px-0">
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </CardContent>
        <CardFooter className="border-none bg-transparent! px-3.5 py-2">
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
