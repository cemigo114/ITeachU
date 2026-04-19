import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import StandardBadge from '../components/StandardBadge';

const TeacherBrowseTasks = ({
  EXAMPLE_TASKS,
  onBack,
  onViewDetail,
  onAssignTask,
  searchQuery,
  setSearchQuery,
  selectedGrade,
  setSelectedGrade,
  selectedDomain,
  setSelectedDomain,
  showFilters,
  setShowFilters,
  collectionView,
  setCollectionView,
}) => {
  const grades = [...new Set(EXAMPLE_TASKS.map((t) => t.grade))];
  const domains = [...new Set(EXAMPLE_TASKS.map((t) => t.domain))];

  const [expandedDescriptions, setExpandedDescriptions] = React.useState(new Set());

  const toggleDescription = (taskId) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const filteredTasks = EXAMPLE_TASKS.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.standard.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || task.grade === selectedGrade;
    const matchesDomain = selectedDomain === 'all' || task.domain === selectedDomain;
    return matchesSearch && matchesGrade && matchesDomain;
  });

  const getGroupedTasks = () => {
    if (collectionView === 'byGrade') {
      return grades.reduce((acc, grade) => {
        acc[grade] = filteredTasks.filter((t) => t.grade === grade);
        return acc;
      }, {});
    }
    if (collectionView === 'byDomain') {
      return domains.reduce((acc, domain) => {
        acc[domain] = filteredTasks.filter((t) => t.domain === domain);
        return acc;
      }, {});
    }
    return { 'All Tasks': filteredTasks };
  };

  const groupedTasks = getGroupedTasks();
  const filterCount =
    (selectedGrade !== 'all' ? 1 : 0) + (selectedDomain !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="teacher"
        title="Task Bank"
        subtitle={`${filteredTasks.length} tasks available`}
        onBack={onBack}
      />

      <div className="max-w-7xl mx-auto p-6">
        <Card variant="elevated" padding="md" className="mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Search by task name or standard code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl font-body text-neutral-900 focus-ring focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              icon={<Filter className="w-5 h-5" />}
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <span className="inline-flex items-center gap-2">
                Filters
                {filterCount > 0 && (
                  <Badge
                    variant="brand"
                    size="sm"
                    className="!rounded-full min-w-[1.25rem] justify-center"
                  >
                    {filterCount}
                  </Badge>
                )}
              </span>
            </Button>

            <select
              value={collectionView}
              onChange={(e) => setCollectionView(e.target.value)}
              className="px-4 py-2.5 border border-neutral-300 rounded-xl font-body text-neutral-900 bg-white focus-ring focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 shrink-0"
            >
              <option value="all">All Tasks</option>
              <option value="byGrade">Group by Grade</option>
              <option value="byDomain">Group by Domain</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 font-display">
                  Grade Level
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-body focus-ring focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="all">All Grades</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 font-display">
                  Domain
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-body focus-ring focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="all">All Domains</option>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              {filterCount > 0 && (
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGrade('all');
                      setSelectedDomain('all');
                    }}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 focus-ring rounded-lg px-1 py-0.5"
                  >
                    <X className="w-4 h-4" aria-hidden />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {Object.entries(groupedTasks).map(([groupName, tasks]) => (
          <div key={groupName} className="mb-8">
            {collectionView !== 'all' && (
              <h2 className="text-xl font-display font-bold text-neutral-900 mb-4">{groupName}</h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  variant="default"
                  accent="teacher"
                  padding="md"
                  className="shadow-card hover:shadow-elevated transition-shadow border-2 border-transparent hover:border-brand-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-semibold text-lg text-neutral-900 flex-1 pr-2">
                      {task.title}
                    </h3>
                  </div>

                  <div className="mb-3">
                    <p className={`text-sm text-neutral-600 ${expandedDescriptions.has(task.id) ? '' : 'line-clamp-2'}`}>
                      {task.description}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleDescription(task.id); }}
                      className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700 focus-ring rounded px-0.5 transition-colors"
                    >
                      {expandedDescriptions.has(task.id) ? 'Show less' : 'Show more'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3 items-center">
                    <Badge variant="default" size="sm">
                      {task.grade}
                    </Badge>
                    {task.standardId ? (
                      <StandardBadge standardId={task.standardId} standardCode={task.standard} />
                    ) : (
                      <Badge variant="brand" size="sm">
                        {task.standard}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500 mb-4">{task.domain}</div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      role="teacher"
                      className="flex-1"
                      onClick={() => onViewDetail(task)}
                    >
                      View Details
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      role="student"
                      className="flex-1"
                      onClick={() => onAssignTask(task)}
                    >
                      Assign
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {tasks.length === 0 && (
              <Card variant="flat" padding="lg" className="text-center">
                <p className="text-neutral-500">No tasks found matching your criteria.</p>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherBrowseTasks;
