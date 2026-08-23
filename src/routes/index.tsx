import {
	Badge,
	Button,
	Card,
	Group,
	Switch,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<>
			<Title order={1} mb="md">
				Home
			</Title>
			<Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
				<Text fw={500} size="lg">
					Welcome to Mantine!
				</Text>
				<Text c="dimmed" size="sm">
					Mantine is wired up and working alongside Tailwind CSS.
				</Text>
			</Card>
			<Group mb="md">
				<Button>Primary button</Button>
				<Button variant="light">Light button</Button>
				<Badge color="teal">Ready</Badge>
			</Group>
			<TextInput label="Playground input" placeholder="Type something..." mb="md" />
			<Switch label="Dark mode friendly switch" defaultChecked />
		</>
	);
}
