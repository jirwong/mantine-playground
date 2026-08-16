import {
	Badge,
	Button,
	Card,
	Group,
	Stack,
	Switch,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { ColorSchemeToggle } from "../components/ColorSchemeToggle";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<Stack p="lg" gap="md" maw={480} mx="auto">
			<Group justify="space-between">
				<Title order={1}>Mantine Playground</Title>
				<ColorSchemeToggle />
			</Group>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Text fw={500} size="lg">
					Welcome to Mantine!
				</Text>
				<Text c="dimmed" size="sm">
					Mantine is wired up and working alongside Tailwind CSS.
				</Text>
			</Card>
			<Group>
				<Button>Primary button</Button>
				<Button variant="light">Light button</Button>
				<Badge color="teal">Ready</Badge>
			</Group>
			<TextInput label="Playground input" placeholder="Type something..." />
			<Switch label="Dark mode friendly switch" defaultChecked />
		</Stack>
	);
}
