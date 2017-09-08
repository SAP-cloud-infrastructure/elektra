@javascript
Feature: Role Assignments
  Background:
    Given Test user has accepted terms of use
    Given I visit domain path "home"
    And I log in as test_user
    Then I am redirected to domain path "home"

  Scenario: The Project Members page is reachable
    When I visit project path "identity/projects/members"
    Then the page status code is successful
    And I see "User"

  Scenario: The Project Groups page is reachable
    When I visit project path "identity/projects/groups"
    Then the page status code is successful
    And I see "Group"

  @admin
  Scenario: The Project Members page is reachable
    When I visit project path "identity/projects/members"
    Then I see "New Project Member" button
    When I click on "New Project Member"
    Then the page status code is successful
    And  I see "User name or ID"

  @admin
  Scenario: The Project Groups page is reachable
    When I visit project path "identity/projects/groups"
    Then I see "Assign new Group" button
    When I click on "Assign new Group"
    Then the page status code is successful
    And  I see "Group name or ID"

