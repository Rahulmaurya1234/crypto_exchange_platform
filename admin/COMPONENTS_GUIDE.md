# Built-in UI Components Guide

## Overview
This guide covers all the reusable UI components available in the admin panel. All components use Tailwind CSS for styling and follow a consistent design system.

---

## Table of Contents
1. [Button Component](#button-component)
2. [Input Component](#input-component)
3. [Card Component](#card-component)
4. [Badge Component](#badge-component)
5. [LoadingSpinner Component](#loadingspinner-component)
6. [Tabs Component](#tabs-component)
7. [Design System](#design-system)

---

## Button Component

**Location:** `src/components/common/Button.tsx`

### Features
- Multiple variants (primary, secondary, danger, success, ghost)
- Three sizes (sm, md, lg)
- Loading state
- Disabled state
- Full-width option
- Icon support

### Usage Examples

```typescript
import { Button } from '../components/common/Button';
import { Save, Trash, Download } from 'lucide-react';

// Primary button (default)
<Button onClick={handleSave}>
  Save Changes
</Button>

// Secondary button
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  <Trash className="w-4 h-4 mr-2" />
  Delete User
</Button>

// Success button
<Button variant="success" onClick={handleApprove}>
  Approve KYC
</Button>

// Ghost button (transparent)
<Button variant="ghost" onClick={handleView}>
  View Details
</Button>

// Small button
<Button size="sm" variant="secondary">
  Small Button
</Button>

// Large button
<Button size="lg" variant="primary">
  Large Button
</Button>

// Loading state
<Button loading={isSubmitting} onClick={handleSubmit}>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>

// Disabled button
<Button disabled>
  Cannot Click
</Button>

// Full width button
<Button fullWidth variant="primary">
  Full Width Button
</Button>

// Button with icon
<Button variant="primary">
  <Download className="w-5 h-5 mr-2" />
  Export Data
</Button>
```

### Props
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;  // Additional Tailwind classes
}
```

---

## Input Component

**Location:** `src/components/common/Input.tsx`

### Features
- Label support
- Error message display
- Helper text
- Validation styling
- Icon support
- Multiple input types

### Usage Examples

```typescript
import { Input } from '../components/common/Input';
import { Mail, Lock, Search, User } from 'lucide-react';

// Basic input
<Input
  label="Email Address"
  name="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="admin@cryptians.com"
/>

// Input with error
<Input
  label="Password"
  name="password"
  type="password"
  value={password}
  onChange={handleChange}
  error={errors.password}
  placeholder="Enter password"
/>

// Input with helper text
<Input
  label="Username"
  name="username"
  value={username}
  onChange={handleChange}
  helperText="Must be 3-20 characters"
/>

// Required input
<Input
  label="Full Name"
  name="name"
  value={name}
  onChange={handleChange}
  required
/>

// Disabled input
<Input
  label="User ID"
  name="userId"
  value={userId}
  disabled
/>

// Search input
<Input
  name="search"
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search users..."
/>

// Textarea
<Input
  label="Reason for Suspension"
  name="reason"
  type="textarea"
  rows={4}
  value={reason}
  onChange={handleChange}
  placeholder="Enter detailed reason..."
/>
```

### Props
```typescript
interface InputProps {
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'search';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;  // For textarea
  className?: string;
}
```

### With Formik Integration
```typescript
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const schema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Too short').required('Required'),
});

<Formik
  initialValues={{ email: '', password: '' }}
  validationSchema={schema}
  onSubmit={handleSubmit}
>
  {({ values, errors, touched, handleChange, handleBlur }) => (
    <Form>
      <Input
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email && errors.email ? errors.email : undefined}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password && errors.password ? errors.password : undefined}
      />
      <Button type="submit">Login</Button>
    </Form>
  )}
</Formik>
```

---

## Card Component

**Location:** `src/components/common/Card.tsx`

### Features
- Main Card container
- CardHeader with optional actions
- CardTitle
- CardContent
- Responsive and clean design

### Usage Examples

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Users, Settings } from 'lucide-react';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>User Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Total Users: 1,234</p>
    <p>Active Users: 987</p>
  </CardContent>
</Card>

// Card with icon in title
<Card>
  <CardHeader>
    <CardTitle>
      <Users className="w-6 h-6 mr-2" />
      User Management
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>

// Card with header action button
<Card>
  <CardHeader>
    <CardTitle>Recent Activity</CardTitle>
    <Button variant="ghost" size="sm">
      <Settings className="w-4 h-4" />
    </Button>
  </CardHeader>
  <CardContent>
    {/* Activity list */}
  </CardContent>
</Card>

// Card with custom className
<Card className="bg-blue-50 border-blue-200">
  <CardContent>
    <p className="text-blue-900">Special notification</p>
  </CardContent>
</Card>

// Full example
<Card>
  <CardHeader>
    <CardTitle>Pending KYC Submissions</CardTitle>
    <Button variant="secondary" size="sm">
      View All
    </Button>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {kycSubmissions.map(item => (
        <div key={item.id} className="flex justify-between items-center">
          <span>{item.userName}</span>
          <Button size="sm">Review</Button>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

---

## Badge Component

**Location:** `src/components/common/Badge.tsx`

### Features
- Color variants
- Status indicators
- Rounded pill design

### Usage Examples

```typescript
import { Badge } from '../components/common/Badge';

// Status badges
<Badge color="green">Active</Badge>
<Badge color="yellow">Pending</Badge>
<Badge color="red">Banned</Badge>
<Badge color="blue">Verified</Badge>
<Badge color="gray">Inactive</Badge>

// In a table
<table>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>
        <Badge color={user.status === 'active' ? 'green' : 'red'}>
          {user.status.toUpperCase()}
        </Badge>
      </td>
    </tr>
  </tbody>
</table>

// KYC Status
<Badge color={kycStatus === 'approved' ? 'green' : kycStatus === 'pending' ? 'yellow' : 'red'}>
  {kycStatus.toUpperCase()}
</Badge>

// Role Badges
const roleColors = {
  Super_Admin: 'red',
  Admin: 'indigo',
  Support_Manager: 'orange',
  Support: 'blue',
};

<Badge color={roleColors[user.role]}>
  {user.role}
</Badge>
```

### Props
```typescript
interface BadgeProps {
  color?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';
  children: React.ReactNode;
  className?: string;
}
```

---

## LoadingSpinner Component

**Location:** `src/components/common/LoadingSpinner.tsx`

### Features
- Animated spinner
- Optional loading text
- Customizable size
- Centered by default

### Usage Examples

```typescript
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// Spinner with text
<LoadingSpinner text="Loading users..." />

// Full page loading
if (isLoading) {
  return <LoadingSpinner text="Fetching data..." />;
}

// Inline loading
<div className="flex items-center gap-4">
  {isSubmitting && <LoadingSpinner />}
  <span>Processing request...</span>
</div>

// Custom size (using className)
<LoadingSpinner className="w-8 h-8" text="Please wait..." />
```

### Props
```typescript
interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}
```

---

## Tabs Component

**Location:** `src/components/common/Tabs.tsx`

### Features
- Tab navigation
- Active state management
- Content switching
- Accessible

### Usage Examples

```typescript
import { Tab, TabContent } from '../components/common/Tabs';
import { useState } from 'react';

function KYCPage() {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <Tab
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingCount})
        </Tab>
        <Tab
          active={activeTab === 'approved'}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({approvedCount})
        </Tab>
        <Tab
          active={activeTab === 'rejected'}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({rejectedCount})
        </Tab>
      </div>

      {/* Tab Content */}
      <TabContent active={activeTab === 'pending'}>
        <PendingKYCList />
      </TabContent>

      <TabContent active={activeTab === 'approved'}>
        <ApprovedKYCList />
      </TabContent>

      <TabContent active={activeTab === 'rejected'}>
        <RejectedKYCList />
      </TabContent>
    </div>
  );
}

// Alternative with icons
import { Clock, CheckCircle, XCircle } from 'lucide-react';

<div className="flex gap-2 border-b">
  <Tab active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
    <Clock className="w-4 h-4 mr-2" />
    Pending
  </Tab>
  <Tab active={activeTab === 'approved'} onClick={() => setActiveTab('approved')}>
    <CheckCircle className="w-4 h-4 mr-2" />
    Approved
  </Tab>
  <Tab active={activeTab === 'rejected'} onClick={() => setActiveTab('rejected')}>
    <XCircle className="w-4 h-4 mr-2" />
    Rejected
  </Tab>
</div>
```

---

## Design System

### Color Palette

#### Primary Colors
- **Indigo:** Primary actions, navigation
  - `bg-indigo-600`, `text-indigo-600`, `border-indigo-600`
  - Hover: `hover:bg-indigo-700`

#### Status Colors
- **Green:** Success, approved, active
  - `bg-green-600`, `text-green-600`
- **Yellow:** Warning, pending
  - `bg-yellow-600`, `text-yellow-600`
- **Red:** Danger, error, banned, rejected
  - `bg-red-600`, `text-red-600`
- **Blue:** Info, default
  - `bg-blue-600`, `text-blue-600`

#### Neutral Colors
- **Gray:** Disabled, inactive, borders
  - `bg-gray-100`, `text-gray-600`, `border-gray-200`

### Typography

#### Headings
```html
<h1 className="text-4xl font-bold text-gray-900">Page Title</h1>
<h2 className="text-3xl font-bold text-gray-900">Section Title</h2>
<h3 className="text-2xl font-bold text-gray-900">Subsection Title</h3>
<h4 className="text-xl font-semibold text-gray-900">Card Title</h4>
```

#### Body Text
```html
<p className="text-gray-600">Regular paragraph text</p>
<p className="text-sm text-gray-500">Small supporting text</p>
<p className="font-medium text-gray-900">Medium weight text</p>
<p className="font-bold text-gray-900">Bold text</p>
```

### Spacing
- **Container Padding:** `p-6` (24px)
- **Card Padding:** `p-6` or `p-8`
- **Section Gap:** `space-y-6` or `space-y-8`
- **Element Gap:** `gap-4` (16px)

### Border Radius
- **Small:** `rounded-lg` (8px)
- **Medium:** `rounded-xl` (12px)
- **Large:** `rounded-2xl` (16px)
- **Full:** `rounded-full` (circle)

### Shadows
- **Card:** `shadow-sm` or `shadow-lg`
- **Hover:** `hover:shadow-xl`

### Layout Patterns

#### Page Layout
```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-4xl font-bold text-gray-900">Page Title</h1>
      <p className="text-gray-600 mt-2 text-lg">Page description</p>
    </div>
    <Button variant="primary">Action Button</Button>
  </div>

  {/* Filters Card */}
  <Card>
    <CardContent>
      {/* Filters */}
    </CardContent>
  </Card>

  {/* Main Content */}
  <Card>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

#### Data Table Pattern
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="text-left py-4 px-6 font-semibold text-gray-700">
          Column Name
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      <tr className="hover:bg-gray-50 transition">
        <td className="py-4 px-6">Cell content</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Grid Layout
```tsx
{/* 4 columns on xl, 3 on lg, 2 on md, 1 on mobile */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

---

## Icon Library

**Using Lucide React**

```typescript
import {
  // User icons
  User, Users, UserCheck, UserX, UserPlus,
  // Status icons
  CheckCircle, XCircle, AlertCircle, Clock,
  // Action icons
  Edit, Trash, Download, Upload, Save,
  // Navigation icons
  Home, Settings, LogOut, Menu, X,
  // Other icons
  Search, Filter, RefreshCw, Eye, EyeOff
} from 'lucide-react';

// Usage
<User className="w-5 h-5 text-gray-600" />
<CheckCircle className="w-6 h-6 text-green-600" />
```

---

## Best Practices

1. **Consistency:** Always use built-in components for UI elements
2. **Accessibility:** Use semantic HTML and proper labels
3. **Responsiveness:** Test on different screen sizes
4. **Loading States:** Always show loading feedback for async operations
5. **Error Handling:** Display clear error messages to users
6. **Color Usage:** Follow the design system color palette
7. **Spacing:** Use consistent spacing throughout the app

---

## Quick Reference

### Common Tailwind Classes

```css
/* Layout */
flex, grid, space-y-6, gap-4

/* Sizing */
w-full, h-full, max-w-md, min-h-screen

/* Spacing */
p-6, px-4, py-2, mt-4, mb-2, m-auto

/* Typography */
text-lg, text-gray-600, font-bold, font-medium

/* Colors */
bg-white, text-gray-900, border-gray-200

/* Borders */
border, border-2, rounded-xl, rounded-full

/* Shadows */
shadow-sm, shadow-lg, hover:shadow-xl

/* Transitions */
transition, duration-300, ease-in-out

/* Hover States */
hover:bg-gray-50, hover:text-indigo-600

/* Responsive */
md:grid-cols-2, lg:grid-cols-3, xl:grid-cols-4
```

---

**Happy Building!** 🎨
