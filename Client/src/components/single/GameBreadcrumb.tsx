import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

interface GameBreadcrumbProps {
  categoryName?: string;
  categoryId?: string;
  gameTitle: string;
}

export function GameBreadcrumb({
  categoryName,
  categoryId,
  gameTitle,
}: GameBreadcrumbProps) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Arcades Box</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {categoryName && categoryId && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/categories?category=${categoryId}`}>
                  {categoryName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-foreground">
            {gameTitle}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
