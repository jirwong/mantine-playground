import {
	AppShell,
	Burger,
	Container,
	Group,
	Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "@tanstack/react-router";

import { ColorSchemeToggle } from "./ColorSchemeToggle";

export function AppLayout() {
	const [opened, { toggle }] = useDisclosure();

	return (
		<AppShell
			padding="md"
			header={{ height: 60 }}
			navbar={{
				width: 260,
				breakpoint: "sm",
				collapsed: { mobile: !opened },
			}}
			footer={{ height: 40 }}
		>
			<AppShell.Header>
				<Group h="100%" px="md" justify="space-between">
					<Group>
						<Burger
							opened={opened}
							onClick={toggle}
							hiddenFrom="sm"
							size="sm"
						/>
						<Text fw={700} size="lg">
							Mantine Playground
						</Text>
					</Group>
					<ColorSchemeToggle />
				</Group>
			</AppShell.Header>

			<AppShell.Navbar p="md">
				<Text c="dimmed" size="sm">
					Navigation
				</Text>
			</AppShell.Navbar>

			<AppShell.Main>
				<Container size="md">
					<Outlet />
				</Container>
			</AppShell.Main>

			<AppShell.Footer p="xs">
				<Group justify="center" h="100%">
					<Text size="xs" c="dimmed">
						Mantine Playground
					</Text>
				</Group>
			</AppShell.Footer>
		</AppShell>
	);
}