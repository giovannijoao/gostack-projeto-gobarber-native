import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, Platform } from 'react-native';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';
import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  ProvidersList,
  ProviderListContainer,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  Title,
  OpenDayPickerButton,
  OpenDayPickerButtonText,
  Schedule,
  Section,
  SectionTitle,
  SectionContent,
  Hour,
  HourText,
  Content,
  CreateAppointmentButton,
  CreateAppointmentButtonText,
} from './styles';

interface RouteParams {
  providerId: string;
}

export interface IProvider {
  id: string;
  name: string;
  avatar_url: string;
}

export interface AvailabilityItem {
  hour: number;
  available: boolean;
}

const CreateAppointment: React.FC = () => {
  const route = useRoute();
  const { user } = useAuth();
  const { goBack, navigate } = useNavigation();
  const routeParams = route.params as RouteParams;

  const [providers, setProviders] = useState<IProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(
    routeParams.providerId,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(0);
  const [dayAvailability, setDayAvailability] = useState<AvailabilityItem[]>(
    [],
  );

  useEffect(() => {
    api.get('providers').then(result => setProviders(result.data));
  }, []);

  useEffect(() => {
    const DEBOUNCE_TIME = 1000;
    const timeout = setTimeout(() => {
      api
        .get<AvailabilityItem[]>(
          `providers/${selectedProvider}/day-availability`,
          {
            params: {
              year: selectedDate.getFullYear(),
              month: selectedDate.getMonth() + 1,
              day: selectedDate.getDate(),
            },
          },
        )
        .then(result => {
          const currentSelectedHourItem = result.data.find(
            x => x.hour === selectedHour,
          );
          if (!currentSelectedHourItem?.available) setSelectedHour(0);
          setDayAvailability(result.data);
        });
    }, DEBOUNCE_TIME);
    return () => clearTimeout(timeout);
  }, [selectedDate, selectedProvider, selectedHour]);

  const { morningAvailability, afternoonAvailability } = useMemo(() => {
    const parsedAvailability = dayAvailability.map(({ hour, available }) => ({
      hour,
      available,
      formattedHour: format(new Date().setHours(hour), 'HH:00'),
    }));
    return {
      morningAvailability: parsedAvailability.filter(({ hour }) => hour < 12),
      afternoonAvailability: parsedAvailability.filter(({ hour }) => hour > 12),
    };
  }, [dayAvailability]);

  const navigateBack = useCallback(() => goBack(), [goBack]);
  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
  }, []);
  const handleToggleDatePicker = useCallback(
    () => setShowDatePicker(state => !state),
    [],
  );
  const handleDateChange = useCallback((_: any, date: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  }, []);
  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);
  const handleCreateAppointment = useCallback(async () => {
    try {
      const date = new Date(selectedDate);
      date.setHours(selectedHour);
      date.setMinutes(0);
      await api.post('appointments', {
        provider_id: selectedProvider,
        date,
      });
      navigate('AppointmentCreated', {
        date: date.getTime(),
      });
    } catch (error) {
      Alert.alert(
        'Erro ao criar agendamento',
        'Ocorreu um erro ao tentar criar o agendamento, tente novamente.',
      );
    }
  }, [navigate, selectedDate, selectedHour, selectedProvider]);

  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>
        <HeaderTitle>Cabelereiros</HeaderTitle>
        <UserAvatar source={{ uri: user.avatar_url }} />
      </Header>
      <Content>
        <ProviderListContainer>
          <ProvidersList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={provider => provider.id}
            renderItem={({ item: provider }) => (
              <ProviderContainer
                selected={selectedProvider === provider.id}
                onPress={() => handleSelectProvider(provider.id)}
              >
                <ProviderAvatar source={{ uri: provider.avatar_url }} />
                <ProviderName selected={selectedProvider === provider.id}>
                  {provider.name}
                </ProviderName>
              </ProviderContainer>
            )}
          />
        </ProviderListContainer>
        <Calendar>
          <Title>
            Data:
            {format(selectedDate, ' dd/MM/yyyy')}
          </Title>
          <OpenDayPickerButton onPress={handleToggleDatePicker}>
            <OpenDayPickerButtonText>
              Selecionar outra data
            </OpenDayPickerButtonText>
          </OpenDayPickerButton>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="calendar"
              onChange={handleDateChange}
            />
          )}
        </Calendar>
        <Schedule>
          <Title>Escolha o horário</Title>
          <Section>
            <SectionTitle>Manhã</SectionTitle>
            <SectionContent>
              {morningAvailability.map(({ formattedHour, available, hour }) => (
                <Hour
                  selected={selectedHour === hour}
                  key={formattedHour}
                  available={available}
                  enabled={available}
                  onPress={() => handleSelectHour(hour)}
                >
                  <HourText selected={selectedHour === hour}>
                    {formattedHour}
                  </HourText>
                </Hour>
              ))}
            </SectionContent>
          </Section>
          <Section>
            <SectionTitle>Tarde</SectionTitle>
            <SectionContent>
              {afternoonAvailability.map(
                ({ formattedHour, available, hour }) => (
                  <Hour
                    selected={selectedHour === hour}
                    key={formattedHour}
                    available={available}
                    enabled={available}
                    onPress={() => handleSelectHour(hour)}
                  >
                    <HourText selected={selectedHour === hour}>
                      {formattedHour}
                    </HourText>
                  </Hour>
                ),
              )}
            </SectionContent>
          </Section>
        </Schedule>
        <CreateAppointmentButton
          enabled={selectedHour !== 0}
          onPress={handleCreateAppointment}
        >
          <CreateAppointmentButtonText>Agendar</CreateAppointmentButtonText>
        </CreateAppointmentButton>
      </Content>
    </Container>
  );
};

export default CreateAppointment;
